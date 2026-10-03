import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

export type SchemaManifest = {
  package: string;
  /** ESM module specifier for the Drizzle schema export.
   *  - npm package path: '@sveltebuilder/local-text-schema/schema'
   *  - project-root-relative: './src/lib/server/schema.ts'
   */
  schema: string;
  after: string[];
};

/** Discovers schema manifests under `root` (default: the current working directory).
 *
 *  Deliberately does not consult INIT_CWD. A package manager sets it to the directory the
 *  user typed the command in, not the project root, and every grandchild process inherits
 *  it — so a tool spawning this CLI in some other directory would be silently redirected
 *  back to wherever the outer command started. That is how `pnpm sql:check` came to
 *  generate no migrations while reporting success. */
export async function discover(root?: string): Promise<SchemaManifest[]> {
  const cwd = root ?? process.cwd();
  const files = await glob('.sveltebuilder/registry/*.json', { cwd, absolute: true });

  const manifests: SchemaManifest[] = [];
  for (const file of files.sort()) {
    const raw = await readFile(file, 'utf-8');
    manifests.push(JSON.parse(raw) as SchemaManifest);
  }

  return manifests;
}
