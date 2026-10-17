import { defineConfig } from 'tsup';
import { readWorkspacePackageVersions } from './src/package-version';

// The SvelteBuilder package versions of this release, read when the CLI is built. The release
// workflow builds after `changeset version`, so these are the versions being published with it.
// turbo.json lists the package.json files as build inputs, so a cached dist cannot replay old ones.
const packageVersions = readWorkspacePackageVersions(new URL('../..', import.meta.url).pathname);

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  define: {
    __SVELTEBUILDER_PACKAGE_VERSIONS__: JSON.stringify(packageVersions),
  },
});
