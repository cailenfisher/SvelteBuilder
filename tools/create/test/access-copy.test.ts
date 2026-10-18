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
const COMPONENT_DIR = path.join(REPO, 'packages', 'access', 'src', 'lib');
const SEED = path.join(REPO, 'tools', 'create', 'templates', 'base', 'supabase', 'seeds', '01-access.sql');

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** Every `'access.…'` literal in the components. A literal is the only way they name a slug. */
function slugsUsed(): Map<string, string> {
  const used = new Map<string, string>();
  for (const file of walk(COMPONENT_DIR).filter((f) => f.endsWith('.svelte'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/'(access\.[a-z_.]+)'/g)) {
      if (m[1] !== undefined) used.set(m[1], path.relative(REPO, file));
    }
  }
  return used;
}

/** Slug → the locales it has copy in, from the seed's `(slug, locale, content)` rows. */
function seededCopy(): Map<string, Set<string>> {
  const seed = fs.readFileSync(SEED, 'utf8');
  const copy = new Map<string, Set<string>>();
  for (const m of seed.matchAll(/\('(access\.[a-z_.]+)',\s*'([a-z-]+)',\s*'/g)) {
    const [, slug, locale] = m;
    if (slug === undefined || locale === undefined) continue;
    copy.set(slug, (copy.get(slug) ?? new Set()).add(locale));
  }
  return copy;
}

/** Slugs the seed creates a link for, from its `('slug')` value rows. */
function seededLinks(): Set<string> {
  const seed = fs.readFileSync(SEED, 'utf8');
  return new Set([...seed.matchAll(/\('(access\.[a-z_.]+)'\)/g)].flatMap((m) => (m[1] ? [m[1]] : [])));
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

  it('creates a link for every slug it writes copy for, and copy for every link', () => {
    expect([...copy.keys()].filter((slug) => !links.has(slug))).toEqual([]);
    expect([...links].filter((slug) => !copy.has(slug))).toEqual([]);
  });
});
