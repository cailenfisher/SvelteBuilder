import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** Workspace packages resolve to their source, not their build output — see vite.config.ts. */
const packages = (relative) => new URL(`../../packages/${relative}`, import.meta.url).pathname;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // kit.alias feeds both Vite's resolver and the generated tsconfig paths, so the dev
    // server and svelte-check agree on what an import means. Subpaths come before their
    // package root: a bare package alias also matches anything beneath it.
    alias: {
      '@sveltebuilder/coreui/styles': packages('coreui/styles'),
      '@sveltebuilder/coreui': packages('coreui/src/lib/index.ts'),
      '@sveltebuilder/content/views': packages('content/src/lib/views.ts'),
      '@sveltebuilder/content/schema': packages('content/src/lib/schema.ts'),
      '@sveltebuilder/content/publishing': packages('content/src/lib/publishing/index.ts'),
      '@sveltebuilder/content': packages('content/src/lib/index.ts'),
      '@sveltebuilder/logistic/views': packages('logistic/src/lib/views.ts'),
      '@sveltebuilder/logistic/schema': packages('logistic/src/lib/schema.ts'),
      '@sveltebuilder/logistic': packages('logistic/src/lib/index.ts'),
      '@sveltebuilder/local-text-schema/seed': packages('local-text-schema/src/seed.ts'),
    },
  },
};

export default config;
