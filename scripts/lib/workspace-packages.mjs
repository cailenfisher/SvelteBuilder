/**
 * Puts this repo's packages into a scaffolded project the way a real install would.
 *
 * Templates are written against the packages in this repo, which are usually ahead of
 * what is published — a screen importing `@sveltebuilder/logistic/views` fails against
 * the registry copy until a release happens. So a harness that verifies against npm can
 * never check an unreleased change, which is precisely the change that needs checking.
 *
 * The obvious way to do that is `link:`, and it was how this started. It is wrong in a
 * way that took a DataTable screen to expose: a linked package keeps its own
 * node_modules, so it resolves the repo's svelte while the project resolves its own.
 * Two copies of svelte mean two declarations of the `unique symbol` that brands
 * `Snippet`, and TypeScript reports every cross-package snippet prop as
 * "Two different types with this name exist, but they are unrelated" — a failure with no
 * bug behind it, on a boundary every table-shaped screen crosses.
 *
 * Packing each package and installing the tarball fixes that, because the project then
 * owns one copy of everything and peer dependencies resolve against it. It is also
 * strictly closer to what a user gets, and it checks something linking never could: that
 * the `files` array and `exports` map actually ship what the templates import.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Workspace packages a scaffolded project may depend on, by npm name. */
export const WORKSPACE_PACKAGES = {
  '@sveltebuilder/coreui': 'packages/coreui',
  '@sveltebuilder/local-text-schema': 'packages/local-text-schema',
  '@sveltebuilder/content': 'packages/content',
  '@sveltebuilder/logistic': 'packages/logistic',
};

/**
 * Packs every workspace package and returns { name → absolute tarball path }.
 *
 * Packing requires the package to be built; the caller is responsible for that, since it
 * knows whether a build already ran.
 */
export function packWorkspacePackages(repo) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sveltebuilder-tgz-'));
  const tarballs = {};

  for (const [name, rel] of Object.entries(WORKSPACE_PACKAGES)) {
    execFileSync('pnpm', ['pack', '--pack-destination', dir], {
      cwd: path.join(repo, rel),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  // pnpm names the tarball <scope>-<name>-<version>.tgz, so match on the prefix rather
  // than reconstructing the version.
  const files = readdirSync(dir);
  for (const name of Object.keys(WORKSPACE_PACKAGES)) {
    const prefix = `${name.replace('@', '').replace('/', '-')}-`;
    const file = files.find((f) => f.startsWith(prefix) && f.endsWith('.tgz'));
    if (!file) throw new Error(`pnpm pack produced no tarball for ${name}`);
    tarballs[name] = path.join(dir, file);
  }

  return { dir, tarballs };
}

/**
 * Points a scaffolded project's dependencies at the packed tarballs.
 *
 * As `pnpm.overrides` rather than by rewriting the dependency ranges, so the project's
 * own package.json still records what it would really depend on — and so a transitive
 * dependency between two workspace packages (logistic depends on coreui) resolves to the
 * local tarball too, instead of fetching a published copy that may be behind.
 */
export function overrideWithTarballs(projectDir, tarballs) {
  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const overrides = {};

  for (const [name, tarball] of Object.entries(tarballs)) {
    if (pkg.dependencies?.[name] || pkg.devDependencies?.[name]) {
      overrides[name] = `file:${tarball}`;
    }
  }

  pkg.pnpm = { ...(pkg.pnpm ?? {}), overrides };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return overrides;
}

/**
 * $env/static/public is read at build time, so the values have to exist. Nothing here
 * ever connects to them: no harness starts a server or opens a socket.
 */
export function writeBuildEnv(projectDir) {
  writeFileSync(
    path.join(projectDir, '.env'),
    [
      'PUBLIC_SUPABASE_URL=http://127.0.0.1:54321',
      'PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_harness',
      'PUBLIC_DEFAULT_LOCALE=en',
      'PUBLIC_SITE_URL=http://localhost:5173',
      '',
    ].join('\n')
  );
}
