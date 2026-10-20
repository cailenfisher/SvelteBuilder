import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserGroup } from '@sveltebuilder/access/schema';
import type { UserAccountOption, UserGroupMemberRow } from '@sveltebuilder/access/views';
import { toOne, type QueryResult } from '$lib/server/postgrest';

/**
 * A group's members. Email addresses are identity, outside the public tables, so the caller
 * passes the users it already loaded (`listUserAccount`) and members are matched by id.
 */
export async function listUserGroupMember(
  supabase: SupabaseClient,
  userGroupId: number,
  userAccounts: UserAccountOption[]
): Promise<QueryResult<UserGroupMemberRow[]>> {
  const byId = new Map(userAccounts.map((userAccount) => [userAccount.id, userAccount]));
  const { data, error } = await supabase
    .from('user_group_member')
    .select('user_group_id, user_account_id, created_at')
    .eq('user_group_id', userGroupId)
    .order('created_at');
  if (error) return { data: null, error };

  const members: UserGroupMemberRow[] = [];
  for (const row of data) {
    const userAccount = byId.get(Number(row.user_account_id));
    if (userAccount) members.push({ userGroupId: row.user_group_id, userAccount, createdAt: row.created_at });
  }
  return { data: members, error: null };
}

/** The groups one user belongs to. */
export async function listUserGroupOfUserAccount(
  supabase: SupabaseClient,
  userAccountId: number
): Promise<QueryResult<UserGroup[]>> {
  const { data, error } = await supabase
    .from('user_group_member')
    .select('user_group(id, external, created_at, updated_at)')
    .eq('user_account_id', userAccountId);
  if (error) return { data: null, error };

  const userGroups: UserGroup[] = [];
  for (const row of data) {
    const userGroup = toOne(row.user_group);
    if (userGroup) {
      userGroups.push({
        id: userGroup.id,
        external: userGroup.external,
        createdAt: userGroup.created_at,
        updatedAt: userGroup.updated_at,
      });
    }
  }
  return { data: userGroups, error: null };
}

export async function addUserGroupMember(
  supabase: SupabaseClient,
  userGroupId: number,
  userAccountId: number
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('add_user_group_member', {
    p_user_group_id: userGroupId,
    p_user_account_id: userAccountId,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

export async function removeUserGroupMember(
  supabase: SupabaseClient,
  userGroupId: number,
  userAccountId: number
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('remove_user_group_member', {
    p_user_group_id: userGroupId,
    p_user_account_id: userAccountId,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
