import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: [
      { find: '@sveltebuilder/coreui/styles', replacement: resolve('../../packages/coreui/styles') },
      { find: '@sveltebuilder/coreui', replacement: resolve('../../packages/coreui/src/lib/index.ts') },
      { find: '@sveltebuilder/hermes', replacement: resolve('../../packages/hermes/src/lib/index.ts') },
      // content's Drizzle query layer was removed; the pure publishing utilities
      // that lived beside it moved to @sveltebuilder/content/publishing.
      { find: '@sveltebuilder/content/publishing', replacement: resolve('../../packages/content/src/lib/publishing/index.ts') },
      { find: '@sveltebuilder/content', replacement: resolve('../../packages/content/src/lib/index.ts') }
    ]
  },
  ssr: {
    noExternal: ['@sveltebuilder/content', '@sveltebuilder/coreui', '@sveltebuilder/hermes', 'bits-ui']
  }
});
