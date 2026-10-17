import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  SVELTEBUILDER_PACKAGES,
  pinPackageVersions,
  readWorkspacePackageVersions,
} from '../src/package-version.js';

/**
 * A scaffold depends on the SvelteBuilder versions its templates were written against, never on
 * `latest`. Under the 2.0 release candidate, `latest` installed 1.x packages beneath 2.0
 * templates and the project failed to typecheck with 201 errors.
 */

const createRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(createRoot, '..', '..');
const templatesDir = path.join(createRoot, 'templates');

/** Every @sveltebuilder dependency a scaffold can receive, from templates or a chosen module. */
function scaffoldablePackageNames(): string[] {
  const names = new Set<string>();
  for (const template of fs.readdirSync(templatesDir)) {
    const manifest = path.join(templatesDir, template, 'package.json');
    if (!fs.existsSync(manifest)) continue;
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
      if (name.startsWith('@sveltebuilder/')) names.add(name);
    }
  }
  for (const module of fs.readdirSync(path.join(templatesDir, 'modules'))) {
    names.add(`@sveltebuilder/${module}`);
  }
  return [...names].sort();
}

describe('readWorkspacePackageVersions', () => {
  it('reads each package’s version from this checkout', () => {
    const versions = readWorkspacePackageVersions(repositoryRoot);
    for (const [name, directory] of Object.entries(SVELTEBUILDER_PACKAGES)) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(repositoryRoot, directory, 'package.json'), 'utf8')
      ) as { version: string };
      expect(versions[name]).toBe(manifest.version);
    }
  });
});

describe('SVELTEBUILDER_PACKAGES', () => {
  it('knows every SvelteBuilder package a template or module can add to a scaffold', () => {
    expect(scaffoldablePackageNames().filter((name) => !(name in SVELTEBUILDER_PACKAGES))).toEqual([]);
  });
});

describe('pinPackageVersions', () => {
  const versions = { '@sveltebuilder/coreui': '1.0.0-rc.0', '@sveltebuilder/cli': '0.0.16-rc.0' };

  it('pins dependencies and devDependencies to a caret on this release, leaving others alone', () => {
    const pkg = {
      dependencies: { '@sveltebuilder/coreui': 'latest', diglossia: 'latest' },
      devDependencies: { '@sveltebuilder/cli': 'latest', vite: '^8.3.1' },
    };
    pinPackageVersions(pkg, versions);
    expect(pkg).toEqual({
      dependencies: { '@sveltebuilder/coreui': '^1.0.0-rc.0', diglossia: 'latest' },
      devDependencies: { '@sveltebuilder/cli': '^0.0.16-rc.0', vite: '^8.3.1' },
    });
  });

  it('refuses a SvelteBuilder package it has no version for, rather than leaving it at latest', () => {
    expect(() =>
      pinPackageVersions({ dependencies: { '@sveltebuilder/commerce': 'latest' } }, versions)
    ).toThrow(/@sveltebuilder\/commerce/);
  });
});
