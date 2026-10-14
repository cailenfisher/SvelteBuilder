import type { SupabaseClient } from '@supabase/supabase-js';
import type { DictionaryPayload, LocalTextLink } from 'diglossia';
import type { LocalText } from '@sveltebuilder/local-text-schema/schema';
import type { QueryResult } from '$lib/server/postgrest';

/** One row as `public.get_dictionary` returns it. bigint columns arrive as strings. */
type DictionaryRow = {
  link_id: number | string;
  slug: string;
  scope: string | null;
  entity_id: number | string | null;
  content: string;
  locale_code: string;
};

/**
 * The serialization boundary for dictionary rows: snake_case stops here, and the
 * bigint columns PostgREST sends as strings become numbers. Nothing downstream
 * sees either.
 */
function toDictionaryPayload(rows: DictionaryRow[] | null): DictionaryPayload {
  return (rows ?? []).map((row) => ({
    link: {
      id: Number(row.link_id),
      slug: row.slug,
      scope: row.scope,
      entityId: row.entity_id !== null ? Number(row.entity_id) : null,
    },
    content: row.content,
    localeCode: row.locale_code,
  }));
}

/** A new piece of copy and its first translations, created together by one RPC. */
export type LocalTextEntryFields = {
  slug: string;
  scope: string | null;
  /** The row the copy belongs to, for entity-bound copy such as an article's headline. */
  entityId: number | null;
  localeIds: number[];
  contents: string[];
};

const selectLocalTextLink = (supabase: SupabaseClient) =>
  supabase.from('local_text_link').select('id, slug, scope, entity_id');

type LocalTextLinkRecord = NonNullable<
  Awaited<ReturnType<typeof selectLocalTextLink>>['data']
>[number];

const toLocalTextLink = (row: LocalTextLinkRecord): LocalTextLink => ({
  id: row.id,
  slug: row.slug,
  scope: row.scope,
  entityId: row.entity_id,
});

export async function listLocalTextLink(
  supabase: SupabaseClient
): Promise<QueryResult<LocalTextLink[]>> {
  const { data, error } = await selectLocalTextLink(supabase).order('slug');
  if (error) return { data: null, error };
  return { data: data.map(toLocalTextLink), error: null };
}

export async function getLocalTextLink(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<LocalTextLink | null>> {
  const { data, error } = await selectLocalTextLink(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toLocalTextLink(data) : null, error: null };
}

/** Every translation of every piece of copy, or only those of one link. */
export async function listLocalText(
  supabase: SupabaseClient,
  linkId?: number
): Promise<QueryResult<Pick<LocalText, 'id' | 'link' | 'locale' | 'content'>[]>> {
  const query = supabase.from('local_text').select('id, link, locale, content');
  const { data, error } = linkId === undefined ? await query : await query.eq('link', linkId);
  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Writes one translation. `uq_local_text_entry (link, locale)` is what makes this an upsert
 * rather than a read-then-write.
 */
export async function saveLocalText(
  supabase: SupabaseClient,
  localText: Pick<LocalText, 'link' | 'locale' | 'content'>
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('local_text')
    .upsert(localText, { onConflict: 'link,locale' });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/**
 * One RPC, not an insert followed by a second insert: the link and its copy have to land in
 * the same transaction or a failure leaves an orphaned slug.
 */
export async function createLocalTextEntry(
  supabase: SupabaseClient,
  fields: LocalTextEntryFields
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('create_local_text_entry', {
    p_slug: fields.slug,
    p_scope: fields.scope,
    p_locale_ids: fields.localeIds,
    p_contents: fields.contents,
    p_entity_id: fields.entityId,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/** Removes a piece of copy and every translation of it, in one transaction. */
export async function deleteLocalTextEntry(
  supabase: SupabaseClient,
  linkId: number
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('delete_local_text_entry', { p_link_id: linkId });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/**
 * The copy for one locale, already resolved to one row per key by `get_dictionary`, which is
 * STABLE and SECURITY INVOKER: locale-priority resolution happens in SQL, and the public-read
 * policies on the three i18n tables make it readable without a session. A null `scope` means
 * global copy only; a null `entityId` means every entity in the scope.
 */
export async function getDictionaryPayload(
  supabase: SupabaseClient,
  filter: {
    localeCode: string;
    fallbackLocaleCode: string;
    scope: string | null;
    entityId: number | null;
  }
): Promise<QueryResult<DictionaryPayload>> {
  const { data, error } = await supabase.rpc('get_dictionary', {
    user_locale_code: filter.localeCode,
    fallback_locale_code: filter.fallbackLocaleCode,
    scope_filter: filter.scope,
    entity_id_filter: filter.entityId,
  });
  if (error) return { data: null, error };
  return { data: toDictionaryPayload(data as DictionaryRow[] | null), error: null };
}
