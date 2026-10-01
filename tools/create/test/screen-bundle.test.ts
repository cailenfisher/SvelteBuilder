import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The half of a screen bundle's contract that types cannot express.
 *
 * `@sveltebuilder/<module>/views` states what a loader returns and what a screen
 * reads, and `svelte-check` inside a scaffolded project enforces it — that is what
 * `pnpm scaffold:check` covers. What neither can see is everything that is true of a
 * bundle only by convention: that its manifest lists the routes it actually ships,
 * that its `requires` name bundles which exist, that the copy it renders was seeded,
 * and that the seed carries both required locales.
 *
 * None of that fails a typecheck or a build. A slug with no seeded row renders the
 * `[missing: …]` sentinel and a page that is merely wrong ships green — which is how
 * the supplier bundle came to declare three slugs that nothing seeds.
 *
 * This suite reads the template tree and the module sources directly, so it needs no
 * build and no database.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const MODULES_DIR = path.join(REPO, 'tools', 'create', 'templates', 'modules');

/** Locales every module seed must cover — see CLAUDE.md, Seed file conventions. */
const REQUIRED_LOCALES = ['en', 'fr'];

type Manifest = {
  id: string;
  module: string;
  label: string;
  hint: string;
  routes: string[];
  /**
   * Routes that are `+server.ts` endpoints rather than pages — a feed, a sitemap. They have no
   * `ui/` half at all, so they are declared separately: `routes` means "has a page", and
   * conflating the two would make the page assertions below unenforceable for every bundle that
   * happens to ship an endpoint.
   */
  endpoints?: string[];
  requires?: string[];
  views?: string[];
  actions?: Record<string, Record<string, string[]>>;
  copySlugs?: string[];
};

type Bundle = {
  manifest: Manifest;
  dir: string;
  module: string;
  id: string;
};

// ── Reading the tree ─────────────────────────────────────────────────────────

const readDirs = (dir: string) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];

/** Every file under `dir`, as paths relative to it. */
function walk(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full, base) : [path.relative(base, full)];
  });
}

/**
 * Selectable bundles only. A directory starting with `_` is a holding area for route
 * code not yet ported — never selectable, never copied — so it is not held to any of
 * this, which is the whole point of parking code there.
 */
function discoverBundles(): Bundle[] {
  return readDirs(MODULES_DIR).flatMap((module) => {
    const screensDir = path.join(MODULES_DIR, module, 'screens');
    return readDirs(screensDir)
      .filter((id) => !id.startsWith('_'))
      .flatMap((id) => {
        const dir = path.join(screensDir, id);
        const manifestPath = path.join(dir, 'manifest.json');
        if (!fs.existsSync(manifestPath)) return [];
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
        return [{ manifest, dir, module, id }];
      });
  });
}

const BUNDLES = discoverBundles();
const BUNDLE_KEYS = new Set(BUNDLES.map((b) => `${b.module}:${b.id}`));

// ── Reading the seed ─────────────────────────────────────────────────────────

/**
 * What a module's seed.sql actually creates: which slugs get a `local_text_link`, and
 * which locales each one has copy for.
 *
 * Parsed statement by statement rather than by tuple shape, because the seeds use
 * three different insert forms — a bare `values` list of `(slug, scope, entity_id)`,
 * a `select 'slug', 'scope', x.id from …` for entity-bound links, and content inserts
 * whose value tuples are `(slug, content)` in some blocks and `(slug, scope, content)`
 * in others. Collecting quoted literals per statement is indifferent to all of that.
 */
function readSeed(module: string) {
  const seedPath = path.join(MODULES_DIR, module, 'seed', 'seed.sql');
  const links = new Map<string, Set<string>>(); // scope → slugs
  const copy = new Map<string, Set<string>>(); // locale code → slugs

  if (!fs.existsSync(seedPath)) return { links, copy, exists: false };

  const sql = fs.readFileSync(seedPath, 'utf8');
  // Comments carry example slugs and prose; stripping them first keeps both out.
  const statements = sql
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const addTo = (map: Map<string, Set<string>>, key: string, slug: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(slug);
  };

  for (const statement of statements) {
    const isLinkInsert = /insert\s+into\s+local_text_link\b/i.test(statement);
    const isCopyInsert = /insert\s+into\s+local_text\s*\(/i.test(statement);
    if (!isLinkInsert && !isCopyInsert) continue;

    if (isLinkInsert) {
      // ('slug', 'scope', null) — application-level UI copy.
      for (const m of statement.matchAll(/\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*null\s*\)/gi)) {
        addTo(links, m[2], m[1]);
      }
      // select 'slug', 'scope', <entity>.id — entity-bound copy, one row per entity.
      for (const m of statement.matchAll(/select\s+'([^']+)'\s*,\s*'([^']+)'\s*,/gi)) {
        addTo(links, m[2], m[1]);
      }
      continue;
    }

    // A content insert names its locale once, as `locale where code = 'xx'`.
    const localeMatch = statement.match(/locale\s+where\s+code\s*=\s*'([^']+)'/i);
    if (!localeMatch) continue;
    const locale = localeMatch[1];

    // Any literal that is a slug this module declares. Restricting to declared slugs
    // is what makes this safe against picking up content strings and scope names.
    const declared = new Set([...links.values()].flatMap((s) => [...s]));
    for (const m of statement.matchAll(/'([^']+)'/g)) {
      if (declared.has(m[1])) addTo(copy, locale, m[1]);
    }
  }

  return { links, copy, exists: true };
}

/** Global slugs — scope null — come from the base seed, not any module. */
function readGlobalSlugs(): Set<string> {
  const file = path.join(REPO, 'packages', 'local-text-schema', 'src', 'seed', 'base-slugs.ts');
  const source = fs.readFileSync(file, 'utf8');
  return new Set([...source.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]));
}

const GLOBAL_SLUGS = readGlobalSlugs();

// ── Reading a screen's copy usage ────────────────────────────────────────────

type SlugUse = { slug: string; scope: string | null; entityBound: boolean; file: string };

/**
 * Every dictionary lookup a screen makes with a literal slug.
 *
 * Slugs built at runtime (`logistic.pick_task.status.${task.status}`) cannot be
 * resolved here and are deliberately not guessed at — enumerate those in the
 * manifest's copySlugs, where the seeded-copy assertion still covers them.
 */
function readSlugUses(bundleDir: string): SlugUse[] {
  const uiDir = path.join(bundleDir, 'ui');
  const uses: SlugUse[] = [];

  for (const rel of walk(uiDir)) {
    if (!rel.endsWith('.svelte')) continue;
    const source = fs.readFileSync(path.join(uiDir, rel), 'utf8');

    // A screen conventionally wraps its own scope in a one-line helper:
    //   const t = (slug: string) => scoped.localText(slug, 'logistic');
    // Learn each helper's name and scope so its call sites resolve.
    const helpers = new Map<string, string>();
    for (const m of source.matchAll(
      /const\s+(\w+)\s*=\s*\(\s*slug[^)]*\)\s*=>\s*\w+\.localText\(\s*slug\s*,\s*'([^']+)'\s*\)/g
    )) {
      helpers.set(m[1], m[2]);
    }

    for (const [name, scope] of helpers) {
      for (const m of source.matchAll(new RegExp(`\\b${name}\\('([^']+)'\\)`, 'g'))) {
        uses.push({ slug: m[1], scope, entityBound: false, file: rel });
      }
    }

    // Direct calls: .localText('slug'), ('slug', 'scope'), ('slug', 'scope', id).
    for (const m of source.matchAll(
      /\.localText\(\s*'([^']+)'\s*(?:,\s*'([^']+)'\s*(?:,\s*([^)]+))?)?\)/g
    )) {
      uses.push({
        slug: m[1],
        scope: m[2] ?? null,
        entityBound: m[3] !== undefined,
        file: rel,
      });
    }

    // formatText('slug', { … }, 'scope') — the same dictionary key, MF2-interpolated, so
    // a slug reached only this way still has to exist. The values object is skipped
    // non-greedily up to the scope literal or the closing paren.
    for (const m of source.matchAll(
      /\.formatText\(\s*'([^']+)'\s*,[\s\S]*?(?:,\s*'([^']+)'\s*)?\)/g
    )) {
      uses.push({ slug: m[1], scope: m[2] ?? null, entityBound: false, file: rel });
    }

    // <LocalText slug="..." /> resolves against the page context — global scope.
    for (const m of source.matchAll(/<LocalText\s+[^>]*slug="([^"]+)"/g)) {
      uses.push({ slug: m[1], scope: null, entityBound: false, file: rel });
    }
  }

  return uses;
}

// ── The suite ────────────────────────────────────────────────────────────────

it('finds screen bundles to check', () => {
  // Guards against the discovery above silently matching nothing — every assertion
  // below is per-bundle, so an empty tree would make the whole suite vacuous.
  expect(BUNDLES.length).toBeGreaterThan(0);
});

describe.each(BUNDLES)('$module:$id', (bundle) => {
  const { manifest, dir, module, id } = bundle;
  const seed = readSeed(module);

  it('identifies itself the way the tree locates it', () => {
    // The CLI keys a bundle by manifest.module:manifest.id but finds it by directory,
    // so a disagreement makes a selection silently miss.
    expect(manifest.id).toBe(id);
    expect(manifest.module).toBe(module);
    expect(manifest.label?.length ?? 0).toBeGreaterThan(0);
    expect(manifest.hint?.length ?? 0).toBeGreaterThan(0);
  });

  it('declares at least one route or endpoint', () => {
    // A bundle that ships neither is not selectable in any meaningful sense.
    expect(manifest.routes.length + (manifest.endpoints ?? []).length).toBeGreaterThan(0);
  });

  it('ships a page for every route it declares', () => {
    const uiFiles = walk(path.join(dir, 'ui'));

    for (const route of manifest.routes) {
      // `/admin/logistic/supplier/[id]` is authored under a layout group, so the
      // declared route is a suffix of the on-disk path rather than all of it.
      const segments = route.replace(/^\//, '');
      const match = uiFiles.find(
        (file) => file.endsWith('+page.svelte') && path.dirname(file).endsWith(segments)
      );
      expect(match, `no +page.svelte for route ${route}`).toBeDefined();
    }
  });

  it('ships a loader for every page that has one', () => {
    // Not every page needs a server half — a static shell legitimately has none — but a loader
    // with no page is always a mistake, and so is a loader under a path the ui half does not
    // also cover: the two trees merge into one route directory, and a server file whose page is
    // missing would 500 a route nothing renders.
    //
    // `+server.ts` is deliberately not included: an endpoint is the whole route, and has no
    // page by design.
    const uiPages = new Set(
      walk(path.join(dir, 'ui'))
        .filter((f) => f.endsWith('+page.svelte'))
        .map((f) => path.dirname(f))
    );
    const serverPages = walk(path.join(dir, 'server.superprototype')).filter((f) =>
      f.endsWith('+page.server.ts')
    );

    for (const file of serverPages) {
      expect(uiPages.has(path.dirname(file)), `${file} has no +page.svelte beside it`).toBe(true);
    }
  });

  it('ships a handler for every endpoint it declares', () => {
    const serverFiles = walk(path.join(dir, 'server.superprototype'));

    for (const endpoint of manifest.endpoints ?? []) {
      const segments = endpoint.replace(/^\//, '');
      const match = serverFiles.find(
        (file) => file.endsWith('+server.ts') && path.dirname(file).endsWith(segments)
      );
      expect(match, `no +server.ts for endpoint ${endpoint}`).toBeDefined();
    }
  });

  it('declares every endpoint it ships', () => {
    // The reverse direction, which matters more than it looks: an endpoint nobody declared is a
    // route that appears in a scaffolded project without appearing in the manifest, so neither
    // the CLI's screen prompt nor a reader of the tree knows it is there.
    const declared = new Set(manifest.endpoints ?? []);
    const shipped = walk(path.join(dir, 'server.superprototype'))
      .filter((file) => file.endsWith('+server.ts'))
      .map(
        (file) =>
          `/${path
            .dirname(file)
            .split(path.sep)
            .filter((s) => !s.startsWith('('))
            .join('/')}`
      );

    const undeclared = shipped.filter((route) => !declared.has(route));
    expect(undeclared, `endpoints shipped but not declared: ${undeclared.join(', ')}`).toEqual([]);
  });

  it('requires only bundles that exist', () => {
    for (const required of manifest.requires ?? []) {
      const key = required.includes(':') ? required : `${module}:${required}`;
      expect(BUNDLE_KEYS.has(key), `requires ${key}, which is not a bundle`).toBe(true);
      expect(key, 'a bundle cannot require itself').not.toBe(`${module}:${id}`);
    }
  });

  it('names view types the module exports', () => {
    const viewsPath = path.join(REPO, 'packages', module, 'src', 'lib', 'views.ts');
    if ((manifest.views ?? []).length === 0) return;

    expect(fs.existsSync(viewsPath), `${module} declares views but exports none`).toBe(true);
    const source = fs.readFileSync(viewsPath, 'utf8');
    const exported = new Set([...source.matchAll(/export\s+type\s+(\w+)/g)].map((m) => m[1]));

    for (const view of manifest.views ?? []) {
      expect(exported.has(view), `${view} is not exported from ${module}/views`).toBe(true);
    }
  });

  it('declares the form actions its loaders implement', () => {
    // Action names are the one part of the screen contract that is a string on both
    // sides: the page posts to `?/update`, the loader exports `update`. Nothing
    // typechecks that, so the manifest is the inventory and this keeps it true.
    const serverDir = path.join(dir, 'server.superprototype');

    for (const [route, actions] of Object.entries(manifest.actions ?? {})) {
      const segments = route.replace(/^\//, '');
      const file = walk(serverDir).find(
        (f) => f.endsWith('+page.server.ts') && path.dirname(f).endsWith(segments)
      );
      expect(file, `actions declared for ${route}, which has no loader`).toBeDefined();

      const source = fs.readFileSync(path.join(serverDir, file!), 'utf8');
      const block = source.slice(source.indexOf('export const actions'));
      for (const name of Object.keys(actions)) {
        expect(
          new RegExp(`^\\s{2}${name}:`, 'm').test(block),
          `${route} declares action '${name}', which ${file} does not export`
        ).toBe(true);
      }
    }
  });

  it('renders no copy that the seed does not create', () => {
    const uses = readSlugUses(dir);
    const missing: string[] = [];

    for (const use of uses) {
      if (use.scope === null) {
        // Global copy is the base seed's, shared by every scaffold.
        if (!GLOBAL_SLUGS.has(use.slug)) missing.push(`${use.file}: '${use.slug}' (global)`);
        continue;
      }
      const seeded = seed.links.get(use.scope);
      if (!seeded?.has(use.slug)) {
        missing.push(`${use.file}: '${use.slug}' in scope '${use.scope}'`);
      }
    }

    expect(missing, `copy rendered but never seeded:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('declares copy slugs that the seed creates', () => {
    // The manifest is a bundle's inventory of the copy it needs, so a slug listed here
    // and seeded nowhere is a promise the scaffold cannot keep.
    const unseeded = (manifest.copySlugs ?? []).filter((slug) => {
      if (GLOBAL_SLUGS.has(slug)) return false;
      return ![...seed.links.values()].some((slugs) => slugs.has(slug));
    });

    expect(unseeded, `copySlugs with no seeded row: ${unseeded.join(', ')}`).toEqual([]);
  });

  it('declares every slug it renders', () => {
    const declared = new Set(manifest.copySlugs ?? []);
    const undeclared = [
      ...new Set(
        readSlugUses(dir)
          // Entity-bound copy is seeded per row by the entity's own seed block, not
          // named slug by slug — 'name' in scope 'supplier' is one slug across every
          // supplier, and listing it as screen copy would misrepresent it.
          .filter((use) => !use.entityBound)
          .map((use) => use.slug)
          .filter((slug) => !declared.has(slug))
      ),
    ];

    expect(undeclared, `rendered but not in copySlugs: ${undeclared.join(', ')}`).toEqual([]);
  });

  it('seeds its copy in every required locale', () => {
    if (!seed.exists) return;
    const gaps: string[] = [];

    for (const slug of manifest.copySlugs ?? []) {
      if (GLOBAL_SLUGS.has(slug)) continue; // base seed's responsibility, not the module's
      for (const locale of REQUIRED_LOCALES) {
        if (!seed.copy.get(locale)?.has(slug)) gaps.push(`${slug} (${locale})`);
      }
    }

    expect(gaps, `slugs missing a translation: ${gaps.join(', ')}`).toEqual([]);
  });
});
