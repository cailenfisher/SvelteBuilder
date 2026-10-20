import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The backend seam: route code calls one data module per table and never builds a query
 * itself. See .claude/rules/screen-bundle.md, "Data access goes through one data module per table".
 *
 * Types cannot express any of this. A route that calls `.from()` typechecks exactly as well as
 * one that calls a data module, and an import of a data module the selected module does not
 * ship fails only inside a scaffolded project. This suite reads the template tree directly.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(HERE, '..', 'templates');
const MODULES_DIR = path.join(TEMPLATES_DIR, 'modules');
const PACKAGES_DIR = path.resolve(HERE, '..', '..', '..', 'packages');

/** The scaffold flavours with data modules. Native is on hold; see CLAUDE.md. */
const FLAVOURS = ['superprototype'];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const MODULES = fs
  .readdirSync(MODULES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** Every server-side route file: each bundle's server half, and the flavour's own routes. */
const ROUTE_FILES = [
  ...MODULES.flatMap((module) =>
    FLAVOURS.flatMap((flavour) =>
      walk(path.join(MODULES_DIR, module, 'screens')).filter((file) =>
        file.split(path.sep).includes(`server.${flavour}`)
      )
    )
  ),
  ...FLAVOURS.flatMap((flavour) => walk(path.join(TEMPLATES_DIR, flavour, 'src', 'routes'))),
].filter((file) => file.endsWith('.ts'));

const relative = (file: string) => path.relative(TEMPLATES_DIR, file);

it('finds route files to check', () => {
  expect(ROUTE_FILES.length).toBeGreaterThan(30);
});

describe.each(ROUTE_FILES.map(relative))('%s', (file) => {
  const source = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');

  it('builds no query of its own', () => {
    expect(source).not.toMatch(/\.from\(\s*['"]/);
    expect(source).not.toMatch(/\.rpc\(\s*['"]/);
  });

  it('imports only data modules that its module ships', () => {
    const imports = [...source.matchAll(/from '\$lib\/server\/([a-z-]+)\/([a-z-]+)'/g)];
    for (const [, module, table] of imports) {
      const shipped = FLAVOURS.some((flavour) =>
        fs.existsSync(path.join(MODULES_DIR, module, `server.${flavour}`, `${table}.ts`))
      );
      expect(shipped, `$lib/server/${module}/${table}`).toBe(true);
    }
  });
});

/**
 * One data module per table, named like the table's schema file, so a table's queries are where
 * its name says they are. A file with no matching schema file is either a typo or a query
 * module for something that is not a table. The exception is a table sync:supabase generates
 * from the module's manifest, `<entity>_role_assignment` for each scope under `access.entity`,
 * which has no schema file and is named the same way.
 */
describe.each(
  MODULES.flatMap((module) =>
    FLAVOURS.map((flavour) => ({ module, flavour }))
  ).filter(({ module, flavour }) => fs.existsSync(path.join(MODULES_DIR, module, `server.${flavour}`)))
)('$module server.$flavour', ({ module, flavour }) => {
  it('names each data module after a schema file of the module', () => {
    const schemaFiles = new Set(
      fs.readdirSync(path.join(PACKAGES_DIR, module, 'src', 'lib', 'schema'))
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(MODULES_DIR, module, 'manifest.json'), 'utf8')
    ) as { access?: { entity?: string[] } };
    for (const scope of manifest.access?.entity ?? []) {
      schemaFiles.add(`${scope.replaceAll('_', '-')}-role-assignment.ts`);
    }
    for (const file of fs.readdirSync(path.join(MODULES_DIR, module, `server.${flavour}`))) {
      expect(schemaFiles.has(file), file).toBe(true);
    }
  });
});
