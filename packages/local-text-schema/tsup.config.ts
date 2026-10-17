import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    schema: 'src/schema/index.ts',
    seed: 'src/seed.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['drizzle-orm'],
});
