import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

export type SchemaManifest = {
  package: string;
  schemas: string[];
  after: string[];
};

export async function discover(root?: string): Promise<SchemaManifest[]> {
  const cwd = root ?? process.env.INIT_CWD ?? process.cwd();
  const files = await glob('supabase/schemas/_registry/*.json', { cwd, absolute: true });

  const manifests: SchemaManifest[] = [];
  for (const file of files.sort()) {
    const raw = await readFile(file, 'utf-8');
    manifests.push(JSON.parse(raw) as SchemaManifest);
  }

  return manifests;
}
