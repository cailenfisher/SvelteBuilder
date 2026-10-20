import { describe, expect, it } from 'vitest';
import { AccessManifestError, collectAccessCatalog, parseAccessDeclaration } from '../src/lib/access-manifest.ts';
import type { DiscoveredSchemaManifest } from '../src/lib/discover.ts';
import { generateAccessSql } from '../src/lib/generate-access-sql.ts';
import { orderSupplementalFiles } from '../src/lib/order-supplemental-files.ts';

/**
 * The access generator turns registry manifests into SQL that every module's policies depend
 * on. Its SQL only runs under `pnpm sql:check`; these check what that cannot: that every
 * malformed manifest fails with a message naming its file, that the output is stable, and that
 * the generated file applies in the right place.
 */

function manifest(access: unknown, file = '.sveltebuilder/registry/@sveltebuilder-content.json'): DiscoveredSchemaManifest {
  return {
    package: '@sveltebuilder/content',
    schema: '@sveltebuilder/content/schema',
    after: [],
    access,
    file,
  };
}

const CONTENT = {
  permission: {
    article: ['read', 'create', 'update', 'delete', 'share', 'publish'],
    section: ['read', 'update'],
  },
  entity: ['article'],
};

describe('parseAccessDeclaration', () => {
  it('returns null for a manifest with no access key', () => {
    expect(parseAccessDeclaration(manifest(undefined))).toBeNull();
  });

  it('accepts a valid declaration, with entity optional', () => {
    expect(parseAccessDeclaration(manifest(CONTENT))).toEqual(CONTENT);
    expect(parseAccessDeclaration(manifest({ permission: { section: ['read'] } }))).toEqual({
      permission: { section: ['read'] },
      entity: [],
    });
  });

  const invalid: [string, unknown, RegExp][] = [
    ['not an object', ['article'], /must be an object/],
    ['an unknown key', { ...CONTENT, entities: [] }, /unknown key `entities`/],
    ['no permission map', { entity: [] }, /`permission` must map/],
    ['a scope that is not a table name', { permission: { 'Article-Item': ['read'] } }, /scope `Article-Item`/],
    ['an empty action list', { permission: { article: [] } }, /non-empty list/],
    ['an action that is not an identifier', { permission: { article: ["read'; drop table role; --"] } }, /invalid action/],
    ['an action listed twice', { permission: { article: ['read', 'read'] } }, /lists `read` twice/],
    ['an entity scope with no permissions', { permission: { section: ['share'] }, entity: ['article'] }, /does not declare/],
    ['an entity scope without share', { permission: { article: ['read'] }, entity: ['article'] }, /do not include `share`/],
    ['an entity scope listed twice', { permission: { article: ['share'] }, entity: ['article', 'article'] }, /lists a scope twice/],
  ];

  for (const [problem, access, message] of invalid) {
    it(`refuses ${problem}, naming the manifest`, () => {
      const call = () => parseAccessDeclaration(manifest(access, 'registry/broken.json'));
      expect(call).toThrow(AccessManifestError);
      expect(call).toThrow(message);
      expect(call).toThrow(/^registry\/broken\.json: access: /);
    });
  }
});

describe('collectAccessCatalog', () => {
  it('refuses a scope declared by two manifests', () => {
    expect(() =>
      collectAccessCatalog([
        manifest(CONTENT, 'registry/content.json'),
        manifest({ permission: { article: ['read'] } }, 'registry/blog.json'),
      ]),
    ).toThrow(/registry\/blog\.json: access: scope `article` is already declared by registry\/content\.json/);
  });
});

describe('generateAccessSql', () => {
  it('generates nothing when no manifest declares access', () => {
    expect(generateAccessSql(collectAccessCatalog([manifest(undefined)]))).toBeNull();
  });

  it('is byte-identical for the same input, whatever order it was declared in', () => {
    const forwards = generateAccessSql(collectAccessCatalog([manifest(CONTENT)]));
    const reordered = generateAccessSql(
      collectAccessCatalog([
        manifest({
          entity: ['article'],
          permission: { section: ['update', 'read'], article: [...CONTENT.permission.article].reverse() },
        }),
      ]),
    );
    expect(forwards).not.toBeNull();
    expect(reordered).toBe(forwards);
    expect(generateAccessSql(collectAccessCatalog([manifest(CONTENT)]))).toBe(forwards);
  });

  it('writes one catalog row per (scope, action), idempotently', () => {
    const sql = generateAccessSql(collectAccessCatalog([manifest(CONTENT)])) ?? '';
    const catalog = sql.slice(sql.indexOf('insert into public.permission'), sql.indexOf('on conflict do nothing;'));
    expect(catalog.match(/\('(article|section)', '[a-z_]+'\)/g)).toHaveLength(8);
    expect(sql).toContain("('article', 'publish')");
    expect(sql).toContain('on conflict do nothing;');
  });

  it('generates the table and every function only for entity scopes', () => {
    const sql = generateAccessSql(collectAccessCatalog([manifest(CONTENT)])) ?? '';
    for (const name of [
      'public.article_role_assignment',
      'public.current_user_article_ids(p_action text)',
      'public.current_user_article_actions(p_article_ids bigint[])',
      'public.create_article_role_assignment(',
      'public.delete_article_role_assignment(',
      'public.list_article_access(',
      'public.list_article_principal(',
    ]) {
      expect(sql).toContain(name);
    }
    expect(sql).not.toContain('section_role_assignment');
  });

  it('is re-runnable throughout', () => {
    const sql = generateAccessSql(collectAccessCatalog([manifest(CONTENT)])) ?? '';
    expect(sql).not.toMatch(/create table (?!if not exists)/);
    expect(sql).not.toMatch(/create index (?!if not exists)/);
    expect(sql).not.toMatch(/create function/);
    for (const policy of sql.matchAll(/create policy "([^"]+)"/g)) {
      expect(sql).toContain(`drop policy if exists "${policy[1]}"`);
    }
    // Every column has an `add column if not exists`, so a regenerated file upgrades an older table.
    for (const column of ['article_id', 'role_id', 'user_account_id', 'user_group_id', 'granted_by', 'granted_at', 'expires_at']) {
      expect(sql).toContain(`add column if not exists ${column} `);
    }
  });

  it('calls every helper hoisted, as (select …) with a cast array', () => {
    const sql = generateAccessSql(collectAccessCatalog([manifest(CONTENT)])) ?? '';
    expect(sql).not.toMatch(/= any \(\(select [^)]*\(\)\)\)/);
    expect(sql).toContain("article_id = any ((select public.current_user_article_ids('share'))::bigint[])");
  });

  it('refuses a scope whose generated identifiers would exceed 63 characters', () => {
    const long = 'a'.repeat(40);
    expect(() =>
      generateAccessSql(collectAccessCatalog([manifest({ permission: { [long]: ['share'] }, entity: [long] })])),
    ).toThrow(/too long/);
  });
});

describe('orderSupplementalFiles', () => {
  it('sorts by name, with the generated access SQL directly after the core', () => {
    expect(
      orderSupplementalFiles([
        'supabase/supplemental/05-user-account-hardening.sql',
        'supabase/supplemental/access-generated.sql',
        'supabase/supplemental/02-content-rls.sql',
        'supabase/supplemental/01-access.sql',
        'supabase/supplemental/00-auth-functions.sql',
        'supabase/supplemental/01-content-supplements.sql',
      ]),
    ).toEqual([
      'supabase/supplemental/00-auth-functions.sql',
      'supabase/supplemental/01-access.sql',
      'supabase/supplemental/access-generated.sql',
      'supabase/supplemental/01-content-supplements.sql',
      'supabase/supplemental/02-content-rls.sql',
      'supabase/supplemental/05-user-account-hardening.sql',
    ]);
  });

  it('leaves a project with no generated file in name order', () => {
    expect(orderSupplementalFiles(['b.sql', 'a.sql'])).toEqual(['a.sql', 'b.sql']);
  });

  it('refuses a generated file with no core to follow', () => {
    expect(() => orderSupplementalFiles(['access-generated.sql', '02-content-rls.sql'])).toThrow(/01-access\.sql/);
  });
});
