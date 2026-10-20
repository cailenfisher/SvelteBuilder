import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STANDARD_PERMISSION_ACTIONS } from '../../../packages/access/src/lib/schema/permission-action.js';

/**
 * Every slug @sveltebuilder/access's components ask for under the `access` scope is seeded, in
 * both required locales, by the seed every scaffold receives. The package's own tests render the
 * components against a fixture dictionary, so they cannot see the seed; the seed is a template
 * file, so no package test reaches it. This is the check between the two, the way
 * screen-bundle.test.ts checks a module's screens against its seed.
 *
 * A label built at runtime cannot be read from source. The one the package owns, each standard
 * action's `access.permission_action.<action>`, is checked from the action list itself; a
 * module's scopes and verbs are its own seed's to label.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const TEMPLATES = path.join(REPO, 'tools', 'create', 'templates');
const ADMIN = path.join('src', 'routes', '(admin)', 'admin');

/**
 * Where `access` slugs are asked for: the package's components, the administration screens and
 * their shared form, and the actions that report errors as slugs.
 */
const SOURCES = [
  path.join(REPO, 'packages', 'access', 'src', 'lib'),
  ...['role', 'user-group', 'user-account'].flatMap((route) => [
    path.join(TEMPLATES, 'base', ADMIN, route),
    path.join(TEMPLATES, 'superprototype', ADMIN, route),
  ]),
  path.join(TEMPLATES, 'base', 'src', 'lib', 'Role'),
  path.join(TEMPLATES, 'superprototype', ADMIN, 'role-assignment-action.ts'),
];

/** The administration screens, whose global slugs come from the base seed. */
const SCREENS = ['role', 'user-group', 'user-account'].map((route) => path.join(TEMPLATES, 'base', ADMIN, route));

const BASE_SLUGS = path.join(REPO, 'packages', 'local-text-schema', 'src', 'seed', 'base-slugs.ts');
const SEED = path.join(REPO, 'tools', 'create', 'templates', 'base', 'supabase', 'seeds', '01-access.sql');

function walk(directory: string): string[] {
  if (fs.statSync(directory).isFile()) return [directory];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** Every `'access.…'` literal in the sources. A literal is the only way they name a slug. */
function slugsUsed(): Map<string, string> {
  const used = new Map<string, string>();
  for (const file of SOURCES.flatMap(walk).filter((f) => f.endsWith('.svelte') || f.endsWith('.ts'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/'(access\.[a-z_.]+)'/g)) {
      if (m[1] !== undefined) used.set(m[1], path.relative(REPO, file));
    }
  }
  return used;
}

/** The seed's statements, comments stripped. */
const seedStatements = () =>
  fs
    .readFileSync(SEED, 'utf8')
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim());

/**
 * Slug → the locales it has copy in. Each copy insert names its locale once
 * (`locale where code = 'en'`) and lists `(slug, 'access', content)` rows, as a module seed does.
 */
function seededCopy(): Map<string, Set<string>> {
  const copy = new Map<string, Set<string>>();
  for (const statement of seedStatements()) {
    if (!/insert\s+into\s+local_text\s*\(/i.test(statement)) continue;
    const locale = statement.match(/locale\s+where\s+code\s*=\s*'([^']+)'/i)?.[1];
    if (locale === undefined) continue;
    for (const m of statement.matchAll(/\(\s*'(access\.[a-z_.]+)'\s*,\s*'access'\s*,\s*'/g)) {
      if (m[1] !== undefined) copy.set(m[1], (copy.get(m[1]) ?? new Set()).add(locale));
    }
  }
  return copy;
}

/** Slugs the seed creates a link for, from its `(slug, 'access', null)` rows. */
function seededLinks(): Set<string> {
  const links = new Set<string>();
  for (const statement of seedStatements()) {
    if (!/insert\s+into\s+local_text_link\b/i.test(statement)) continue;
    for (const m of statement.matchAll(/\(\s*'(access\.[a-z_.]+)'\s*,\s*'access'\s*,\s*null\s*\)/g)) {
      if (m[1] !== undefined) links.add(m[1]);
    }
  }
  return links;
}

describe('access UI copy', () => {
  const copy = seededCopy();
  const links = seededLinks();
  const used = slugsUsed();

  it('finds the components’ slugs at all', () => {
    expect(used.size).toBeGreaterThan(10);
  });

  it('seeds every slug a component uses, in en and fr', () => {
    const gaps = [...used]
      .filter(([slug]) => !links.has(slug) || !copy.get(slug)?.has('en') || !copy.get(slug)?.has('fr'))
      .map(([slug, file]) => `${slug} (${file})`);
    expect(gaps).toEqual([]);
  });

  it('labels every standard permission action, in en and fr', () => {
    const missing = STANDARD_PERMISSION_ACTIONS.map((action) => `access.permission_action.${action}`).filter(
      (slug) => !links.has(slug) || !copy.get(slug)?.has('en') || !copy.get(slug)?.has('fr')
    );
    expect(missing).toEqual([]);
  });

  it('finds every global slug the administration screens use in the base seed', () => {
    const global = new Set([...fs.readFileSync(BASE_SLUGS, 'utf8').matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]));
    const gaps: string[] = [];
    for (const file of SCREENS.flatMap(walk).filter((f) => f.endsWith('.svelte'))) {
      const source = fs.readFileSync(file, 'utf8');
      // `dictionary` is each screen's root dictionary, which holds only global copy.
      for (const m of source.matchAll(/\bdictionary\.localText\('([^']+)'\)/g)) {
        if (m[1] !== undefined && !global.has(m[1])) gaps.push(`${m[1]} (${path.relative(REPO, file)})`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it('creates a link for every slug it writes copy for, and copy for every link', () => {
    expect([...copy.keys()].filter((slug) => !links.has(slug))).toEqual([]);
    expect([...links].filter((slug) => !copy.has(slug))).toEqual([]);
  });
});
