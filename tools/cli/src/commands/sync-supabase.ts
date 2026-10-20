import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { glob } from 'glob';
import { discover } from '../lib/discover.ts';
import { resolve } from '../lib/resolve.ts';
import { generateBaseSeedSql } from '../lib/generate-seed-sql.ts';
import { unansweredDrizzleKitPrompt } from '../lib/drizzle-kit-prompt.ts';
import { collectAccessCatalog } from '../lib/access-manifest.ts';
import { ACCESS_GENERATED_FILE, generateAccessSql } from '../lib/generate-access-sql.ts';
import { orderSupplementalFiles } from '../lib/order-supplemental-files.ts';
import { LOCALES, BASE_SLUGS } from '@sveltebuilder/local-text-schema/seed';

const SVELTEBUILDER_DIR = '.sveltebuilder';
const BARREL_SCHEMA_PATH = path.join(SVELTEBUILDER_DIR, 'schema.ts');
const DRIZZLE_CONFIG_PATH = path.join(SVELTEBUILDER_DIR, 'drizzle.config.ts');
const MIGRATIONS_DIR = path.join('supabase', 'migrations');
const SUPPLEMENTAL_DIR = path.join('supabase', 'supplemental');
const SEEDS_DIR = path.join('supabase', 'seeds');
const SEED_OUT = path.join('supabase', 'seed.sql');

export async function syncSupabase(root?: string): Promise<void> {
  const cwd = root ?? process.cwd();

  console.log('[sveltebuilder] sync:supabase — discovering schema manifests...');
  const manifests = await discover(root);
  if (manifests.length === 0) {
    // Not a no-op worth tolerating. Every scaffold registers at least
    // @sveltebuilder/local-text-schema, so an empty registry means this is running
    // somewhere that is not a project root — and returning 0 here let a caller report
    // success while generating nothing.
    throw new Error(
      `no schema manifests in ${path.join(cwd, SVELTEBUILDER_DIR, 'registry')} — every ` +
        'scaffold registers at least @sveltebuilder/local-text-schema, so this is probably ' +
        'not a project root',
    );
  }
  console.log(`[sveltebuilder] found ${manifests.length} manifest(s): ${manifests.map((m) => m.package).join(', ')}`);

  console.log('[sveltebuilder] resolving schema order...');
  const ordered = resolve(manifests);
  const orderLog = ordered.map((m, i) => `  ${i + 1}. ${m.package} (${m.schema})`).join('\n');
  console.log(`[sveltebuilder] resolved order:\n${orderLog}`);

  // Validated before anything is written, so a bad manifest changes nothing.
  const accessSql = generateAccessSql(collectAccessCatalog(ordered));

  // ── 1. Generate barrel schema file ─────────────────────────────────────────
  await mkdir(path.join(cwd, SVELTEBUILDER_DIR), { recursive: true });

  const barrelLines = ordered.map((m) => {
    // Local paths (./src/...) are relative to project root; from .sveltebuilder/ we need ../
    const specifier = m.schema.startsWith('.')
      ? path.posix.join('..', m.schema.replace(/^\.\//, ''))
      : m.schema;
    return `export * from '${specifier}';`;
  });
  await writeFile(path.join(cwd, BARREL_SCHEMA_PATH), barrelLines.join('\n') + '\n', 'utf-8');
  console.log(`[sveltebuilder] wrote ${BARREL_SCHEMA_PATH}`);

  // ── 2. Generate drizzle config ──────────────────────────────────────────────
  const drizzleConfig = [
    `import { defineConfig } from 'drizzle-kit';`,
    `export default defineConfig({`,
    `  schema: './${BARREL_SCHEMA_PATH.replace(/\\/g, '/')}',`,
    `  out: './${MIGRATIONS_DIR.replace(/\\/g, '/')}',`,
    `  dialect: 'postgresql',`,
    `});`,
  ].join('\n') + '\n';
  await writeFile(path.join(cwd, DRIZZLE_CONFIG_PATH), drizzleConfig, 'utf-8');
  console.log(`[sveltebuilder] wrote ${DRIZZLE_CONFIG_PATH}`);

  // ── 3. Run drizzle-kit generate ─────────────────────────────────────────────
  console.log('[sveltebuilder] running drizzle-kit generate...');
  await mkdir(path.join(cwd, MIGRATIONS_DIR), { recursive: true });

  const migrationsBefore = new Set(await listMigrations(cwd));
  runDrizzleKit(cwd, []);
  const generatedMigrations = (await listMigrations(cwd)).filter((f) => !migrationsBefore.has(f));

  // ── 4. Supplemental SQL: only into a migration that has never been applied ──
  //
  // Supplemental SQL that is not yet in any migration goes into a migration created by this
  // run, never into an existing one. An existing migration may already be applied somewhere:
  // `supabase db push` records it by version and will not run it again, so SQL appended to it
  // reached a hosted database never, while `db reset` locally replayed it and hid the problem.
  // When drizzle-kit generated a migration this run, the supplemental SQL rides along in it;
  // otherwise (the usual case for an RLS fix or a new function) drizzle-kit is asked for an
  // empty custom migration, which it registers in its journal so its own numbering and
  // Supabase's version ordering both stay intact.
  //
  // "Not yet in any migration" is judged by content across every migration, so an unchanged
  // file is skipped and an edited one is carried forward in full: the later migration replaces
  // what the earlier one created, which is why supplemental SQL is written to be re-runnable
  // (create or replace, drop policy if exists). Deleting a file undoes nothing; to remove an
  // object, write the drop in a supplemental file.
  //
  // The generated access SQL is written here, before the search, so it is carried forward by
  // exactly the same rule. sync owns that file: when no manifest declares access it is removed,
  // which, like deleting any supplemental file, undoes nothing already migrated.
  const accessGeneratedPath = path.join(cwd, SUPPLEMENTAL_DIR, ACCESS_GENERATED_FILE);
  if (accessSql === null) {
    await rm(accessGeneratedPath, { force: true });
  } else {
    await mkdir(path.join(cwd, SUPPLEMENTAL_DIR), { recursive: true });
    await writeFile(accessGeneratedPath, accessSql, 'utf-8');
    console.log(`[sveltebuilder] wrote ${path.join(SUPPLEMENTAL_DIR, ACCESS_GENERATED_FILE)}`);
  }

  const supplementalFiles = orderSupplementalFiles(await glob(`${SUPPLEMENTAL_DIR}/*.sql`, { cwd }));

  const migrationSql = (
    await Promise.all(
      (await listMigrations(cwd)).map((f) => readFile(path.join(cwd, f), 'utf-8')),
    )
  ).join('\n');

  const pendingBlocks: string[] = [];
  for (const f of supplementalFiles) {
    const content = await readFile(path.join(cwd, f), 'utf-8');
    if (migrationSql.includes(content.trim())) {
      console.log(`[sveltebuilder] skipping already-migrated supplemental: ${path.basename(f)}`);
      continue;
    }
    pendingBlocks.push(`\n-- supplemental: ${path.basename(f)}\n${content}`);
  }

  if (pendingBlocks.length > 0) {
    let target = generatedMigrations.at(-1);
    if (target === undefined) {
      const beforeCustom = new Set(await listMigrations(cwd));
      runDrizzleKit(cwd, ['--custom', '--name', 'supplemental']);
      target = (await listMigrations(cwd)).find((f) => !beforeCustom.has(f));
      if (target === undefined) {
        throw new Error('drizzle-kit generate --custom created no migration for the supplemental SQL');
      }
    }
    await appendToFile(path.join(cwd, target), pendingBlocks.join('\n'));
    console.log(`[sveltebuilder] wrote ${pendingBlocks.length} supplemental file(s) to ${target}`);
  } else if (generatedMigrations.length === 0) {
    console.log('[sveltebuilder] no schema or supplemental changes; no new migration');
  }

  // ── 5. Generate supabase/seed.sql ───────────────────────────────────────────
  console.log('[sveltebuilder] generating supabase/seed.sql...');
  let seedSql = generateBaseSeedSql(LOCALES, BASE_SLUGS);

  // Append any supabase/seeds/*.sql files in alphabetical order
  const seedFiles = await glob(`${SEEDS_DIR}/*.sql`, { cwd });
  seedFiles.sort();
  for (const f of seedFiles) {
    const content = await readFile(path.join(cwd, f), 'utf-8');
    const label = path.basename(f);
    seedSql += `\n-- ============================================================\n`;
    seedSql += `-- ${label} (appended by sveltebuilder sync:supabase)\n`;
    seedSql += `-- ============================================================\n`;
    seedSql += content;
  }

  await mkdir(path.join(cwd, 'supabase'), { recursive: true });
  await writeFile(path.join(cwd, SEED_OUT), seedSql, 'utf-8');
  console.log(`[sveltebuilder] wrote ${SEED_OUT}`);

  console.log('[sveltebuilder] sync:supabase complete');
}

/** Migration files, relative to the project root, in version order. */
async function listMigrations(cwd: string): Promise<string[]> {
  const files = await glob(`${MIGRATIONS_DIR}/*.sql`, { cwd });
  return files.sort();
}

function runDrizzleKit(cwd: string, extraArgs: string[]): void {
  const drizzleKitBin = path.join(cwd, 'node_modules', '.bin', 'drizzle-kit');
  const drizzleKitCmd = existsSync(drizzleKitBin) ? drizzleKitBin : 'npx drizzle-kit';
  const [cmd, ...args] = drizzleKitCmd.split(' ');
  if (cmd === undefined) throw new Error('no drizzle-kit command to run');

  // In a terminal drizzle-kit can ask about renames and the person answers. Without one it cannot,
  // and it gives up silently (see drizzle-kit-prompt.ts), so its output is read for the question
  // it left unanswered rather than trusting its exit status.
  const interactive = process.stdin.isTTY === true;
  const result = spawnSync(
    cmd,
    [...args, 'generate', '--config', DRIZZLE_CONFIG_PATH, ...extraArgs],
    {
      cwd,
      stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      shell: process.platform === 'win32',
    },
  );
  if (!interactive) {
    // drizzle-kit leaves its last prompt line unterminated; end it so what follows starts clean.
    const stdout = result.stdout ?? '';
    process.stdout.write(stdout === '' || stdout.endsWith('\n') ? stdout : `${stdout}\n`);
    process.stderr.write(result.stderr ?? '');
  }
  if (result.status !== 0) {
    throw new Error(`drizzle-kit generate ${extraArgs.join(' ')} failed`.trimEnd());
  }

  const question = interactive ? null : unansweredDrizzleKitPrompt(`${result.stdout ?? ''}${result.stderr ?? ''}`);
  if (question !== null) {
    throw new Error(
      [
        'drizzle-kit needs an answer it cannot get without a terminal, so no migration was written:',
        `  ${question}`,
        'Run `sveltebuilder sync:supabase` in a terminal and answer each question. A schema object',
        'renamed in this change is "renamed", one that is new is "created".',
      ].join('\n'),
    );
  }
}

async function appendToFile(filePath: string, content: string): Promise<void> {
  const existing = await readFile(filePath, 'utf-8');
  await writeFile(filePath, existing + content, 'utf-8');
}
