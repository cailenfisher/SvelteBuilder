#!/usr/bin/env node
/**
 * Applies a scaffolded project's generated SQL to a real Postgres and asserts that the
 * database it produces behaves the way the routes assume.
 *
 * `pnpm scaffold:check` proves a scaffold typechecks and builds; neither step executes
 * a single line of SQL. So a malformed seed, a policy that admits nobody, or an RPC
 * whose body does not compile all ship green. This closes that: the migration and seed
 * run, the seed runs a second time to prove it is re-runnable, and then the assertions
 * in scripts/sql-check/ impersonate real principals — an admin, a non-admin, an
 * anonymous visitor — through `set role` plus a JWT subject, exactly as PostgREST does.
 *
 * That last part is the load-bearing bit. The role is why RLS applies at all: as a
 * table-owning role Postgres skips policies entirely, which is the bypass that made
 * every policy in this project inert until SuperPrototype moved to PostgREST. Checks
 * that run as `postgres` would pass against a database with no policies at all.
 *
 * Requires Docker. Everything Supabase supplies and the scaffold does not — the auth
 * schema, auth.uid(), the PostgREST roles, the bootstrap grants — is stubbed in
 * scripts/sql-check/00-supabase-stub.sql; a failure pointing there is the stub's
 * problem, not the schema's.
 *
 * Usage:
 *   node scripts/sql-check.mjs                     # scaffold a project, check it
 *   node scripts/sql-check.mjs --modules logistic  # with modules (default: logistic)
 *   node scripts/sql-check.mjs --project <dir>     # reuse an existing project's SQL
 *   node scripts/sql-check.mjs --keep              # leave the container running
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREATE_CLI = path.join(REPO, 'tools', 'create', 'dist', 'index.js');
const SYNC_CLI = path.join(REPO, 'tools', 'cli', 'dist', 'index.js');
const ASSERT_DIR = path.join(REPO, 'scripts', 'sql-check');

const CONTAINER = 'sveltebuilder-sql-check';
const IMAGE = 'postgres:17-alpine';
const DB = 'sqlcheck';

const args = process.argv.slice(2);
const keep = args.includes('--keep');
const flag = (name) => {
  const inline = args.find((a) => a.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const modules = flag('modules') ?? 'logistic';
const reuseProject = flag('project');

const run = (command, commandArgs, cwd) =>
  execFileSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' },
  });

const docker = (...a) => run('docker', a);

/** psql inside the container, failing the process on the first error. */
function psql(file) {
  docker('cp', file, `${CONTAINER}:/tmp/in.sql`);
  return docker(
    'exec',
    CONTAINER,
    'psql',
    '-U',
    'postgres',
    '-d',
    DB,
    '-v',
    'ON_ERROR_STOP=1',
    '-q',
    '-f',
    '/tmp/in.sql'
  );
}

const steps = [];
function step(label, fn) {
  try {
    const output = fn() ?? '';
    steps.push({ label, ok: true });
    console.log(`   ✓ ${label}`);
    return output;
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}` || String(err.message ?? err);
    steps.push({ label, ok: false });
    console.log(`   ✗ ${label}`);
    console.log(
      output
        .split('\n')
        .map((l) => `     ${l}`)
        .join('\n')
    );
    return null;
  }
}

const ok = () => steps.every((s) => s.ok);

// ── Preflight ────────────────────────────────────────────────────────────────

try {
  docker('info');
} catch {
  console.error('Docker is not available — sql-check needs it to run Postgres.');
  process.exit(1);
}

for (const cli of [CREATE_CLI, SYNC_CLI]) {
  if (!existsSync(cli)) {
    console.error(`Missing ${path.relative(REPO, cli)} — run \`pnpm build\` first.`);
    process.exit(1);
  }
}

// ── The project whose SQL is under test ──────────────────────────────────────

const workdir = reuseProject ? null : mkdtempSync(path.join(tmpdir(), 'sveltebuilder-sql-check-'));
let projectDir = reuseProject ? path.resolve(reuseProject) : path.join(workdir, 'sqlcheck');

console.log(`modules: ${modules}\n`);

if (!reuseProject) {
  step('scaffold', () =>
    run(
      'node',
      [
        CREATE_CLI,
        'sqlcheck',
        '--template',
        'superprototype',
        '--pm',
        'pnpm',
        '--modules',
        modules,
        '--screens',
        'all',
        '--no-install',
      ],
      workdir
    )
  );

  // sync:supabase reads the module manifests out of the project and drives drizzle-kit,
  // which needs its own dependencies — so this is the one place an install is required.
  if (ok()) {
    step('install', () => {
      const pkgPath = path.join(projectDir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const links = {
        '@sveltebuilder/coreui': 'packages/coreui',
        '@sveltebuilder/local-text-schema': 'packages/local-text-schema',
        '@sveltebuilder/content': 'packages/content',
        '@sveltebuilder/logistic': 'packages/logistic',
      };
      const overrides = {};
      for (const [name, rel] of Object.entries(links)) {
        if (pkg.dependencies?.[name] || pkg.devDependencies?.[name]) {
          overrides[name] = `link:${path.join(REPO, rel)}`;
        }
      }
      pkg.pnpm = { ...(pkg.pnpm ?? {}), overrides };
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      return run('pnpm', ['install', '--ignore-workspace'], projectDir);
    });
  }

  if (ok()) step('sync:supabase', () => run('node', [SYNC_CLI, 'sync:supabase'], projectDir));
}

const migrationsDir = path.join(projectDir, 'supabase', 'migrations');
const seedFile = path.join(projectDir, 'supabase', 'seed.sql');

if (ok() && !existsSync(migrationsDir)) {
  console.error(`No migrations at ${migrationsDir}`);
  process.exit(1);
}

// ── Postgres ─────────────────────────────────────────────────────────────────

if (ok()) {
  step('start postgres', () => {
    try {
      docker('rm', '-f', CONTAINER);
    } catch {
      // no such container, which is the normal case
    }
    docker(
      'run',
      '-d',
      '--name',
      CONTAINER,
      '-e',
      'POSTGRES_PASSWORD=sqlcheck',
      '-e',
      `POSTGRES_DB=${DB}`,
      IMAGE
    );

    // pg_isready rather than a fixed sleep: the image initialises in a few seconds but
    // not a predictable number of them.
    const deadline = Date.now() + 60_000;
    for (;;) {
      try {
        docker('exec', CONTAINER, 'pg_isready', '-U', 'postgres', '-d', DB);
        return '';
      } catch (err) {
        if (Date.now() > deadline) throw err;
        execFileSync('sleep', ['1']);
      }
    }
  });
}

if (ok()) step('supabase stub', () => psql(path.join(ASSERT_DIR, '00-supabase-stub.sql')));

if (ok()) {
  const migrations = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of migrations) {
    if (!ok()) break;
    step(`migration ${file}`, () => psql(path.join(migrationsDir, file)));
  }
}

if (ok() && existsSync(seedFile)) {
  step('seed', () => psql(seedFile));
  // Twice, because re-runnability is a property of the conflict clauses rather than of
  // the statements, and `supabase db reset` is not the only thing that replays a seed.
  // The base assertions check no link was duplicated by this.
  if (ok()) step('seed again (re-runnable)', () => psql(seedFile));
}

// ── Assertions ───────────────────────────────────────────────────────────────

if (ok()) {
  const assertions = readdirSync(ASSERT_DIR)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('00-'))
    .sort();
  for (const file of assertions) {
    if (!ok()) break;
    step(file.replace(/^\d+-/, '').replace(/\.sql$/, ''), () => psql(path.join(ASSERT_DIR, file)));
  }
}

// ── Teardown ─────────────────────────────────────────────────────────────────

console.log('');
console.log('─'.repeat(60));
console.log(ok() ? 'PASS  sql-check' : 'FAIL  sql-check');
console.log('─'.repeat(60));

if (keep || !ok()) {
  console.log(`container ${CONTAINER} left running — psql into it with:`);
  console.log(`  docker exec -it ${CONTAINER} psql -U postgres -d ${DB}`);
  if (workdir) console.log(`project left at ${projectDir}`);
} else {
  try {
    docker('rm', '-f', CONTAINER);
  } catch {
    // nothing to remove
  }
  if (workdir) rmSync(workdir, { recursive: true, force: true });
}

process.exit(ok() ? 0 : 1);
