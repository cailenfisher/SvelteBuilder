import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '@sveltebuilder/coreui': resolve('../../packages/coreui/src/lib/index.ts'),
      '@sveltebuilder/hermes': resolve('../../packages/hermes/src/lib/index.ts'),
      '@sveltebuilder/blog': resolve('../../packages/blog/src/lib/index.ts')
    }
  },
  ssr: {
    noExternal: ['@sveltebuilder/blog', '@sveltebuilder/coreui', '@sveltebuilder/hermes', 'bits-ui']
  }
});
