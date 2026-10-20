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
  // .svelte file. coreui pulls in bits-ui, which pulls in runed and svelte-toolbelt. All four
  // are inlined: an externalized runed reads a second copy of svelte's context, and every
  // Checkbox fails with lifecycle_outside_component.
  ssr: {
    resolve: { conditions: ['svelte'] },
    noExternal: ['@sveltebuilder/coreui', 'bits-ui', 'runed', 'svelte-toolbelt'],
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
