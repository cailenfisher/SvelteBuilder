import type { SupabaseClient } from '@supabase/supabase-js';
import type { Locale } from 'diglossia';
import type { QueryResult } from '$lib/server/postgrest';

/** Every column the `Locale` type needs. */
const selectLocale = (supabase: SupabaseClient) =>
  supabase.from('locale').select('id, code, name, native_name, dir');

type LocaleRecord = NonNullable<Awaited<ReturnType<typeof selectLocale>>['data']>[number];

/** The serialization boundary for locales. */
function toLocale(row: LocaleRecord): Locale {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nativeName: row.native_name,
    dir: row.dir as 'ltr' | 'rtl',
  };
}

/** The columns an administrator edits on a locale. */
export type LocaleFields = {
  code: string;
  name: string;
  nativeName: string;
  dir: string;
};

/**
 * Every locale. `public.locale` is world-readable (locale_public_read), so this works with no
 * session on the publishable key, which is what lets the locale hook run on every request.
 */
export async function listLocale(
  supabase: SupabaseClient,
  orderBy: 'code' | 'name' = 'code'
): Promise<QueryResult<Locale[]>> {
  const { data, error } = await selectLocale(supabase).order(orderBy);
  if (error) return { data: null, error };
  return { data: data.map(toLocale), error: null };
}

export async function getLocale(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<Locale | null>> {
  const { data, error } = await selectLocale(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toLocale(data) : null, error: null };
}

export async function getLocaleByCode(
  supabase: SupabaseClient,
  code: string
): Promise<QueryResult<Locale | null>> {
  const { data, error } = await selectLocale(supabase).eq('code', code).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toLocale(data) : null, error: null };
}

export async function createLocale(
  supabase: SupabaseClient,
  fields: LocaleFields
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('locale').insert({
    code: fields.code,
    name: fields.name,
    native_name: fields.nativeName,
    dir: fields.dir,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

export async function updateLocale(
  supabase: SupabaseClient,
  id: number,
  fields: LocaleFields
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('locale')
    .update({
      code: fields.code,
      name: fields.name,
      native_name: fields.nativeName,
      dir: fields.dir,
    })
    .eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}

export async function deleteLocale(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('locale').delete().eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}
