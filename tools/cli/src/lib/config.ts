import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse, stringify } from 'smol-toml';

export async function writeSchemaConfig(schemaPaths: string[]): Promise<void> {
  const cwd = process.env.INIT_CWD ?? process.cwd();
  const configPath = path.join(cwd, 'supabase', 'config.toml');

  const raw = await readFile(configPath, 'utf-8');
  const config = parse(raw) as Record<string, unknown>;

  if (!config.db) config.db = {};
  const db = config.db as Record<string, unknown>;
  if (!db.migrations) db.migrations = {};
  const migrations = db.migrations as Record<string, unknown>;
  migrations.schema_paths = schemaPaths;

  await writeFile(configPath, stringify(config), 'utf-8');
}
