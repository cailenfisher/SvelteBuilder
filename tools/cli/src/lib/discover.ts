import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

export type SchemaManifest = {
  package: string;
  /** ESM module specifier for the Drizzle schema export.
   *  - npm package path: '@sveltebuilder/hermes-schema/schema'
   *  - project-root-relative: './src/lib/server/schema.ts'
   */
  schema: string;
  after: string[];
};

export async function discover(root?: string): Promise<SchemaManifest[]> {
  const cwd = root ?? process.env.INIT_CWD ?? process.cwd();
  const files = await glob('.sveltebuilder/registry/*.json', { cwd, absolute: true });

  const manifests: SchemaManifest[] = [];
  for (const file of files.sort()) {
    const raw = await readFile(file, 'utf-8');
    manifests.push(JSON.parse(raw) as SchemaManifest);
  }

  return manifests;
}
