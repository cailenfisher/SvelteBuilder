#!/usr/bin/env node
/**
 * Scaffolds projects from the local template tree and checks that each one typechecks
 * and builds.
 *
 * This is the gate that was missing. The Logistic module shipped a broken scaffold from
 * the day SuperPrototype moved to PostgREST until a manual smoke test found it, because
 * nothing in CI ever scaffolded a project. Unit tests on the packages could not have
 * caught it: the break was in template files, which are inert text until the CLI copies
 * them into a project.
 *
 * Two details are load-bearing.
 *
 * Workspace packages are packed and installed from the tarball, not taken from npm.
 * Templates are written against the packages in this repo, which are usually ahead of
 * what is published — a screen importing `@sveltebuilder/logistic/views` fails against
 * the registry copy until a release happens. Verifying against npm would mean this gate
 * can never check an unreleased change, which is precisely the change that needs
 * checking. See scripts/lib/workspace-packages.mjs for why tarballs rather than `link:`;
 * the short version is that a linked package brings its own copy of svelte.
 *
 * The CLI is driven by flags, never by feeding keystrokes to its prompts. Scripting a
 * TUI over a pseudo-terminal works right up until a prompt is added or reordered.
 *
 * Usage:
 *   node scripts/scaffold-check.mjs                # every case
 *   node scripts/scaffold-check.mjs bare logistic  # named cases
 *   node scripts/scaffold-check.mjs --keep         # leave the projects behind
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  overrideWithTarballs,
  packWorkspacePackages,
  writeBuildEnv,
} from './lib/workspace-packages.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREATE_CLI = path.join(REPO, 'tools', 'create', 'dist', 'index.js');
const SYNC_CLI = path.join(REPO, 'tools', 'cli', 'dist', 'index.js');

/**
 * Cases worth the CI minutes: a bare scaffold, each module on its own, and a module
 * whose screens were all declined — that last one catches a screen bundle leaving
 * something behind that the rest of the project depends on.
 */
const CASES = [
  { name: 'bare', modules: 'none', screens: 'none' },
  { name: 'content', modules: 'content', screens: 'all' },
  { name: 'content-no-screens', modules: 'content', screens: 'none' },
  { name: 'logistic', modules: 'logistic', screens: 'all' },
  { name: 'logistic-no-screens', modules: 'logistic', screens: 'none' },
];

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const requested = args.filter((a) => !a.startsWith('-'));
const cases = requested.length > 0 ? CASES.filter((c) => requested.includes(c.name)) : CASES;

if (cases.length === 0) {
  console.error(`No matching cases. Known: ${CASES.map((c) => c.name).join(', ')}`);
  process.exit(1);
}

function run(command, commandArgs, cwd) {
  return execFileSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' },
  });
}

/** Runs a step, returning its output or the failure to report. */
function step(label, fn) {
  try {
    return { label, ok: true, output: fn() ?? '' };
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}` || String(err.message ?? err);
    return { label, ok: false, output };
  }
}

function checkCase(testCase, workdir, tarballs) {
  const projectName = `check-${testCase.name}`;
  const projectDir = path.join(workdir, projectName);
  const steps = [];

  steps.push(
    step('scaffold', () =>
      run(
        'node',
        [
          CREATE_CLI,
          projectName,
          '--template',
          'superprototype',
          '--pm',
          'pnpm',
          '--modules',
          testCase.modules,
          '--screens',
          testCase.screens,
          '--no-install',
        ],
        workdir
      )
    )
  );
  if (!steps.at(-1).ok) return steps;

  steps.push(
    step('use workspace packages', () => {
      overrideWithTarballs(projectDir, tarballs);
      writeBuildEnv(projectDir);
      return '';
    })
  );
  if (!steps.at(-1).ok) return steps;

  // --ignore-workspace: the temp project must not be adopted into this repo's
  // workspace, which would resolve its deps from the root and hide a missing one.
  steps.push(step('install', () => run('pnpm', ['install', '--ignore-workspace'], projectDir)));
  if (!steps.at(-1).ok) return steps;

  // The local CLI rather than the project's installed copy: same reason the packages
  // are packed from here — an unreleased sync change has to be what gets exercised.
  steps.push(step('sync:supabase', () => run('node', [SYNC_CLI, 'sync:supabase'], projectDir)));
  if (!steps.at(-1).ok) return steps;

  steps.push(step('check', () => run('pnpm', ['check'], projectDir)));
  steps.push(step('build', () => run('pnpm', ['build'], projectDir)));

  return steps;
}

for (const cli of [CREATE_CLI, SYNC_CLI]) {
  if (!existsSync(cli)) {
    console.error(`Missing ${path.relative(REPO, cli)} — run \`pnpm build\` first.`);
    process.exit(1);
  }
}

const workdir = mkdtempSync(path.join(tmpdir(), 'sveltebuilder-scaffold-check-'));
console.log(`workdir: ${workdir}`);

// Packed once and reused across cases: the tarballs do not change between them, and
// packing four packages per case would be most of the runtime.
let packed;
try {
  packed = packWorkspacePackages(REPO);
} catch (err) {
  console.error(
    `Could not pack the workspace packages — run \`pnpm build\` first.\n${err.message}`
  );
  process.exit(1);
}
const { tarballs } = packed;
console.log('');

const results = [];
for (const testCase of cases) {
  process.stdout.write(`── ${testCase.name} `.padEnd(60, '─') + '\n');
  const steps = checkCase(testCase, workdir, tarballs);

  for (const s of steps) {
    console.log(`   ${s.ok ? '✓' : '✗'} ${s.label}`);
    if (!s.ok)
      console.log(
        s.output
          .split('\n')
          .map((l) => `     ${l}`)
          .join('\n')
      );
  }

  const ok = steps.every((s) => s.ok);
  results.push({ name: testCase.name, ok });
  console.log('');
}

const failed = results.filter((r) => !r.ok);

console.log('─'.repeat(60));
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
console.log('─'.repeat(60));

if (keep || failed.length > 0) {
  console.log(`projects left at ${workdir}`);
} else {
  rmSync(workdir, { recursive: true, force: true });
  rmSync(packed.dir, { recursive: true, force: true });
}

process.exit(failed.length > 0 ? 1 : 0);
