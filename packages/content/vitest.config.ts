import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The components render server-side here (`render()` from 'svelte/server'), which is
// what Vite's SSR pipeline produces — so the `svelte` export condition has to be set
// for SSR too, or @sveltebuilder/coreui resolves to its types entry instead of its
// components.
export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: { conditions: ['svelte'] },
  // Svelte packages must be transformed, not externalized, or Node is handed a raw
  // .svelte file. coreui pulls in bits-ui, so both have to be inlined.
  ssr: {
    resolve: { conditions: ['svelte'] },
    noExternal: ['@sveltebuilder/coreui', 'bits-ui'],
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
