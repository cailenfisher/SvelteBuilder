import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The SvelteBuilder packages a scaffold may depend on, by npm name, with their directory in this
 * repository.
 *
 * A scaffold has to depend on the versions its templates were written against. Writing `latest`
 * did not: under a prerelease, `npm create sveltebuilder@rc` copied 2.0 templates and then
 * installed the 1.x packages `latest` pointed at, and the project failed to typecheck. So the
 * build stamps this release's versions into the CLI (see tsup.config.ts), and the CLI pins them.
 */
export const SVELTEBUILDER_PACKAGES: Record<string, string> = {
  '@sveltebuilder/cli': 'tools/cli',
  '@sveltebuilder/commerce': 'packages/commerce',
  '@sveltebuilder/coreui': 'packages/coreui',
  '@sveltebuilder/content': 'packages/content',
  '@sveltebuilder/local-text-schema': 'packages/local-text-schema',
  '@sveltebuilder/logistic': 'packages/logistic',
};

/** Each package's version as it stands in this checkout, by npm name. Build time only. */
export function readWorkspacePackageVersions(repositoryRoot: string): Record<string, string> {
  const versions: Record<string, string> = {};
  for (const [name, directory] of Object.entries(SVELTEBUILDER_PACKAGES)) {
    const manifest = JSON.parse(
      readFileSync(path.join(repositoryRoot, directory, 'package.json'), 'utf8')
    ) as { name: string; version: string };
    if (manifest.name !== name) {
      throw new Error(`${directory}/package.json is ${manifest.name}, expected ${name}`);
    }
    versions[name] = manifest.version;
  }
  return versions;
}

type DependencyMap = Record<string, string>;

/**
 * Rewrites every SvelteBuilder dependency of a scaffolded package.json to `^<version>` of this
 * release. A caret on a prerelease (`^2.0.0-rc.0`) admits later release candidates and the final
 * release, and never the previous major.
 *
 * Throws for a `@sveltebuilder/*` dependency with no known version rather than leaving it as
 * the template wrote it: that is a package added to a template but not to
 * SVELTEBUILDER_PACKAGES, and `latest` is exactly the bug this exists to prevent.
 */
export function pinPackageVersions(
  pkg: { dependencies?: DependencyMap; devDependencies?: DependencyMap },
  versions: Record<string, string>
): void {
  for (const dependencies of [pkg.dependencies, pkg.devDependencies]) {
    if (dependencies === undefined) continue;
    for (const name of Object.keys(dependencies)) {
      if (!name.startsWith('@sveltebuilder/')) continue;
      const version = versions[name];
      if (version === undefined) {
        throw new Error(`no release version known for ${name}; add it to SVELTEBUILDER_PACKAGES`);
      }
      dependencies[name] = `^${version}`;
    }
  }
}
