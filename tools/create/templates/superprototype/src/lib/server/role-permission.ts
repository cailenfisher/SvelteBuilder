import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueryResult } from '$lib/server/postgrest';

/** The ids of the permissions a role holds. */
export async function listRolePermissionId(
  supabase: SupabaseClient,
  roleId: number
): Promise<QueryResult<number[]>> {
  const { data, error } = await supabase
    .from('role_permission')
    .select('permission_id')
    .eq('role_id', roleId);
  if (error) return { data: null, error };
  return { data: data.map((row) => row.permission_id), error: null };
}

/** Replaces a role's permissions with exactly these. Refused for a module-managed role. */
export async function setRolePermission(
  supabase: SupabaseClient,
  roleId: number,
  permissionIds: number[]
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('set_role_permissions', {
    p_role_id: roleId,
    p_permission_ids: permissionIds,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
