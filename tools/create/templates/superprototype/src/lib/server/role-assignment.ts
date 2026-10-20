import type { SupabaseClient } from '@supabase/supabase-js';
import type { RoleAssignmentRow, UserAccountOption } from '@sveltebuilder/access/views';
import { toOne, type QueryResult } from '$lib/server/postgrest';

/** Whose global and scope assignments to list: one user's, or one group's. */
export type RoleAssignmentPrincipal = { userAccountId: number } | { userGroupId: number };

const selectRoleAssignment = (supabase: SupabaseClient) =>
  supabase
    .from('role_assignment')
    .select(
      'id, role_id, user_account_id, user_group_id, scope, granted_by, granted_at, expires_at, user_group(id, external)'
    );

type RoleAssignmentRecord = NonNullable<
  Awaited<ReturnType<typeof selectRoleAssignment>>['data']
>[number];

/**
 * A principal's global and scope assignments. Email addresses are identity and live outside the
 * database's public tables, so the caller passes the users it already loaded
 * (`listUserAccount`) and they are matched by id.
 */
export async function listRoleAssignment(
  supabase: SupabaseClient,
  principal: RoleAssignmentPrincipal,
  userAccounts: UserAccountOption[]
): Promise<QueryResult<RoleAssignmentRow[]>> {
  const byId = new Map(userAccounts.map((userAccount) => [userAccount.id, userAccount]));
  const query = selectRoleAssignment(supabase).order('granted_at');
  const { data, error } =
    'userAccountId' in principal
      ? await query.eq('user_account_id', principal.userAccountId)
      : await query.eq('user_group_id', principal.userGroupId);
  if (error) return { data: null, error };

  const toRoleAssignmentRow = (row: RoleAssignmentRecord): RoleAssignmentRow => {
    const userGroup = toOne(row.user_group);
    return {
      id: row.id,
      roleId: row.role_id,
      userAccount: row.user_account_id === null ? null : (byId.get(Number(row.user_account_id)) ?? null),
      userGroup: userGroup ? { id: userGroup.id, external: userGroup.external } : null,
      scope: row.scope,
      entityId: null,
      grantedBy: row.granted_by === null ? null : (byId.get(Number(row.granted_by)) ?? null),
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
    };
  };

  return { data: data.map(toRoleAssignmentRow), error: null };
}

/**
 * Gives a role to a user or a group, everywhere (`scope` null) or on every row of one scope.
 * The database refuses an unknown scope, and a broad grant to an external group.
 */
export async function createRoleAssignment(
  supabase: SupabaseClient,
  fields: {
    roleId: number;
    principal: RoleAssignmentPrincipal;
    scope: string | null;
    expiresAt: string | null;
  }
): Promise<QueryResult<number>> {
  const { data, error } = await supabase.rpc('create_role_assignment', {
    p_role_id: fields.roleId,
    p_user_account_id: 'userAccountId' in fields.principal ? fields.principal.userAccountId : null,
    p_user_group_id: 'userGroupId' in fields.principal ? fields.principal.userGroupId : null,
    p_scope: fields.scope,
    p_expires_at: fields.expiresAt,
  });
  if (error) return { data: null, error };
  return { data: Number(data), error: null };
}

export async function deleteRoleAssignment(supabase: SupabaseClient, id: number): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('delete_role_assignment', { p_role_assignment_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
