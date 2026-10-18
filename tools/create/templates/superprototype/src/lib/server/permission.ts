import type { SupabaseClient } from '@supabase/supabase-js';
import type { Permission } from '@sveltebuilder/access/schema';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * Every scope the current user may do anything in, through any role, broad or on a single row
 * (current_user_scopes()). Every scope in the catalog for an administrator. What admits staff to
 * the admin area and filters its menu (A24); never what decides a single row.
 */
export async function listCurrentUserScope(supabase: SupabaseClient): Promise<QueryResult<string[]>> {
  const { data, error } = await supabase.rpc('current_user_scopes');
  if (error) return { data: null, error };
  return { data: (data as string[] | null) ?? [], error: null };
}

/**
 * Whether the current user may do `action` to every row of `scope` (current_user_can): an
 * administrator, or a broad role. For showing a control such as "New article"; RLS decides.
 */
export async function currentUserCan(
  supabase: SupabaseClient,
  scope: string,
  action: string
): Promise<QueryResult<boolean>> {
  const { data, error } = await supabase.rpc('current_user_can', { p_scope: scope, p_action: action });
  if (error) return { data: null, error };
  return { data: data === true, error: null };
}

/**
 * The permission catalog, by scope then action. sync:supabase writes it from every module's
 * registry manifest; nothing in the app changes it. Readable by administrators only.
 */
export async function listPermission(supabase: SupabaseClient): Promise<QueryResult<Permission[]>> {
  const { data, error } = await supabase
    .from('permission')
    .select('id, scope, action')
    .order('scope')
    .order('action');
  if (error) return { data: null, error };
  return { data, error: null };
}
