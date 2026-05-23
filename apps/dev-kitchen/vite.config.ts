import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: [
      { find: '@sveltebuilder/coreui/styles', replacement: resolve('../../packages/coreui/src/styles') },
      { find: '@sveltebuilder/coreui', replacement: resolve('../../packages/coreui/src/lib/index.ts') },
      { find: '@sveltebuilder/hermes', replacement: resolve('../../packages/hermes/src/lib/index.ts') },
      { find: '@sveltebuilder/blog', replacement: resolve('../../packages/blog/src/lib/index.ts') }
    ]
  },
  ssr: {
    noExternal: ['@sveltebuilder/blog', '@sveltebuilder/coreui', '@sveltebuilder/hermes', 'bits-ui']
  }
});
