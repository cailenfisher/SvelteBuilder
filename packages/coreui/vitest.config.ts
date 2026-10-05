import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Components render server-side here (`render()` from 'svelte/server'), so the `svelte` export
// condition has to be set for SSR, and bits-ui has to be transformed rather than externalized or
// Node is handed a raw .svelte file.
export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: { conditions: ['svelte'] },
  ssr: { resolve: { conditions: ['svelte'] }, noExternal: ['bits-ui', 'runed', 'svelte-toolbelt'] },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
