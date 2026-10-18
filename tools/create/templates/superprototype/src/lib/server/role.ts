import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '@sveltebuilder/access/schema';
import type { QueryResult } from '$lib/server/postgrest';

const selectRole = (supabase: SupabaseClient) =>
  supabase.from('role').select('id, slug, created_at, updated_at');

type RoleRecord = NonNullable<Awaited<ReturnType<typeof selectRole>>['data']>[number];

const toRole = (row: RoleRecord): Role => ({
  id: row.id,
  slug: row.slug,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Every role, module-managed ones first, for the administration screens. */
export async function listRole(supabase: SupabaseClient): Promise<QueryResult<Role[]>> {
  const { data, error } = await selectRole(supabase)
    .order('slug', { ascending: true, nullsFirst: false })
    .order('id');
  if (error) return { data: null, error };
  return { data: data.map(toRole), error: null };
}

export async function getRole(supabase: SupabaseClient, id: number): Promise<QueryResult<Role | null>> {
  const { data, error } = await selectRole(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toRole(data) : null, error: null };
}

/**
 * An administrator's role, with its name in one locale and its permissions, in one transaction
 * (create_role). Cloning a module-managed role is this, with that role's permission ids.
 */
export async function createRole(
  supabase: SupabaseClient,
  fields: { localeId: number; name: string; permissionIds: number[] }
): Promise<QueryResult<number>> {
  const { data, error } = await supabase.rpc('create_role', {
    p_locale_ids: [fields.localeId],
    p_names: [fields.name],
    p_permission_ids: fields.permissionIds,
  });
  if (error) return { data: null, error };
  return { data: Number(data), error: null };
}

/** Deletes an administrator's role, its assignments and its name. Refused for a module's role. */
export async function deleteRole(supabase: SupabaseClient, id: number): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('delete_role', { p_role_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
