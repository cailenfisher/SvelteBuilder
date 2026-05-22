import { discover } from '../lib/discover.ts';
import { resolve } from '../lib/resolve.ts';
import { writeSchemaConfig } from '../lib/config.ts';

export async function sync(): Promise<void> {
  console.log('[sveltebuilder] sync — discovering schema manifests...');
  const manifests = await discover();
  console.log(
    `[sveltebuilder] found ${manifests.length} manifest(s): ${manifests.map((m) => m.package).join(', ')}`
  );

  console.log('[sveltebuilder] resolving schema order...');
  const schemaPaths = resolve(manifests);
  const ordered = schemaPaths.map((p, i) => `  ${i + 1}. ${p}`).join('\n');
  console.log(`[sveltebuilder] resolved order:\n${ordered}`);

  console.log('[sveltebuilder] writing supabase/config.toml...');
  await writeSchemaConfig(schemaPaths);

  console.log(
    `[sveltebuilder] sync complete — ${manifests.length} manifest(s), ${schemaPaths.length} schema(s) written to supabase/config.toml`
  );
}
