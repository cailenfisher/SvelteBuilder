import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/api.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
