import type { DictionaryPayload } from 'diglossia';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Loads every copy row for one or more scopes — a scope's UI copy (entity_id null)
 * and all of its entity-bound copy — resolved to one entry per key and ready for
 * `createDictionary()`.
 *
 * Why not `get_dictionary`: its `entity_id_filter` is null-or-equal, so a null filter
 * restricts to `entity_id is null`. It can return one scope's UI copy, or one single
 * entity's copy, but never a whole scope's entity copy in one call — which is what a
 * list screen of N rows needs. Calling it per row would be N+1 round trips. Use the
 * RPC directly when a route genuinely wants one entity (a detail screen can), and
 * this when it wants a scope.
 *
 * Locale-priority resolution therefore happens here rather than in SQL. That is the
 * app's job either way — diglossia only ever flattens an already-resolved payload —
 * and the userCode-wins pass below is what guarantees the one-entry-per-key rule.
 *
 * Module screens are the main caller: `get_dictionary` with a null scope filter means
 * "scope is null", so the root dictionary carries global copy only and a module's own
 * copy has to be loaded by the screen that needs it.
 */
export async function loadScopedCopy(
  supabase: SupabaseClient,
  scopes: string | string[],
  userCode: string,
  fallbackCode: string,
): Promise<DictionaryPayload> {
  const scopeList = Array.isArray(scopes) ? scopes : [scopes];
  if (scopeList.length === 0) return [];

  const { data, error } = await supabase
    .from('local_text')
    .select('content, locale!inner(code), local_text_link!inner(id, slug, scope, entity_id)')
    .in('local_text_link.scope', scopeList)
    .in('locale.code', [userCode, fallbackCode]);

  if (error) throw error;

  type Row = {
    content: string;
    locale: { code: string } | { code: string }[] | null;
    local_text_link:
      | { id: number; slug: string; scope: string | null; entity_id: number | null }
      | { id: number; slug: string; scope: string | null; entity_id: number | null }[]
      | null;
  };

  const one = <T>(value: T | T[] | null): T | null =>
    value === null ? null : Array.isArray(value) ? (value[0] ?? null) : value;

  // One entry per key, the user's locale winning over the fallback. Rows arrive in no
  // guaranteed order, so this cannot rely on ordering: it overwrites only when the
  // incoming row is the user's locale.
  const resolved = new Map<string, DictionaryPayload[number]>();

  for (const row of (data ?? []) as unknown as Row[]) {
    const link = one(row.local_text_link);
    const localeCode = one(row.locale)?.code;
    if (!link || !localeCode) continue;

    const key = `${link.slug}|${link.scope ?? ''}|${link.entity_id ?? ''}`;
    if (resolved.get(key)?.localeCode === userCode) continue;

    resolved.set(key, {
      link: {
        id: Number(link.id),
        slug: link.slug,
        scope: link.scope,
        entityId: link.entity_id === null ? null : Number(link.entity_id),
      },
      content: row.content,
      localeCode,
    });
  }

  return [...resolved.values()];
}
