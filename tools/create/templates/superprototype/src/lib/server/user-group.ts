import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserGroup } from '@sveltebuilder/access/schema';
import type { QueryResult } from '$lib/server/postgrest';

const selectUserGroup = (supabase: SupabaseClient) =>
  supabase.from('user_group').select('id, external, created_at, updated_at');

type UserGroupRecord = NonNullable<Awaited<ReturnType<typeof selectUserGroup>>['data']>[number];

const toUserGroup = (row: UserGroupRecord): UserGroup => ({
  id: row.id,
  external: row.external,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listUserGroup(supabase: SupabaseClient): Promise<QueryResult<UserGroup[]>> {
  const { data, error } = await selectUserGroup(supabase).order('external').order('id');
  if (error) return { data: null, error };
  return { data: data.map(toUserGroup), error: null };
}

export async function getUserGroup(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<UserGroup | null>> {
  const { data, error } = await selectUserGroup(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toUserGroup(data) : null, error: null };
}

/** A group with its name in one locale, in one transaction. `external` cannot change later. */
export async function createUserGroup(
  supabase: SupabaseClient,
  fields: { localeId: number; name: string; external: boolean }
): Promise<QueryResult<number>> {
  const { data, error } = await supabase.rpc('create_user_group', {
    p_locale_ids: [fields.localeId],
    p_names: [fields.name],
    p_external: fields.external,
  });
  if (error) return { data: null, error };
  return { data: Number(data), error: null };
}

/** Deletes a group, its memberships and its assignments, and its name. */
export async function deleteUserGroup(supabase: SupabaseClient, id: number): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('delete_user_group', { p_user_group_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
