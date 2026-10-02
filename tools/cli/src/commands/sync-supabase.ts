import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { glob } from 'glob';
import { discover } from '../lib/discover.ts';
import { resolve } from '../lib/resolve.ts';
import { generateBaseSeedSql } from '../lib/generate-seed-sql.ts';
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

  const drizzleKitBin = path.join(cwd, 'node_modules', '.bin', 'drizzle-kit');
  const drizzleKitCmd = existsSync(drizzleKitBin) ? drizzleKitBin : 'npx drizzle-kit';
  const [cmd, ...args] = drizzleKitCmd.includes(' ')
    ? drizzleKitCmd.split(' ')
    : [drizzleKitCmd];

  const result = spawnSync(
    cmd!,
    [...args, 'generate', '--config', DRIZZLE_CONFIG_PATH],
    { cwd, stdio: 'inherit', shell: process.platform === 'win32' },
  );

  if (result.status !== 0) {
    throw new Error('drizzle-kit generate failed');
  }

  // ── 4. Append supplemental SQL into the latest generated migration ──────────
  const supplementalFiles = await glob(`${SUPPLEMENTAL_DIR}/*.sql`, { cwd });
  supplementalFiles.sort();

  if (supplementalFiles.length > 0) {
    const migrationFiles = await glob(`${MIGRATIONS_DIR}/*.sql`, { cwd });
    migrationFiles.sort();
    const latestMigration = migrationFiles.at(-1);

    if (latestMigration) {
      // Every migration, not just the newest. Checking only the newest meant a
      // freshly generated migration never contained any marker, so all of the
      // project's supplemental SQL was re-appended to each new migration — the
      // whole set duplicated on every schema change.
      //
      // The test is the file's own content rather than its marker, which keeps the
      // edit case working: an unchanged file is found verbatim in an earlier
      // migration and skipped, while an edited one is not found and so gets
      // appended to the latest migration, where `db reset` will apply it. A
      // marker-only check across all migrations would instead mean an edited
      // supplemental file could never reach the database again. Comparing content
      // also recognises blocks appended by older versions of this command, which
      // wrote the same marker without one.
      const priorMigrations = await Promise.all(
        migrationFiles.map((f) => readFile(path.join(cwd, f), 'utf-8')),
      );
      const appliedSql = priorMigrations.join('\n');

      const supplementalBlocks = await Promise.all(
        supplementalFiles.map(async (f) => {
          const marker = `-- supplemental: ${path.basename(f)}`;
          const content = await readFile(path.join(cwd, f), 'utf-8');
          if (appliedSql.includes(content.trim())) {
            console.log(`[sveltebuilder] skipping already-appended supplemental: ${path.basename(f)}`);
            return null;
          }
          return `\n${marker}\n${content}`;
        }),
      );
      const toAppend = supplementalBlocks.filter((b): b is string => b !== null);
      if (toAppend.length > 0) {
        const combined = toAppend.join('\n');
        await appendToFile(path.join(cwd, latestMigration), combined);
        console.log(
          `[sveltebuilder] appended ${toAppend.length} supplemental file(s) to ${latestMigration}`,
        );
      }
    }
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

async function appendToFile(filePath: string, content: string): Promise<void> {
  const existing = await readFile(filePath, 'utf-8');
  await writeFile(filePath, existing + content, 'utf-8');
}
