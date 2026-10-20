import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserAccount } from '$lib/server/schema';
import type { UserAccountRow } from '@sveltebuilder/access/views';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * Whether a principal is an administrator. Null when the row is not visible, which for a
 * signed-in caller reading their own id means it does not exist: user_account_owner_read is
 * what lets a caller read their own row.
 */
export async function getUserAccountAdmin(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<Pick<UserAccount, 'admin'> | null>> {
  const { data, error } = await supabase
    .from('user_account')
    .select('admin')
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

type UserAccountListRecord = {
  id: number | string;
  email_address: string;
  admin: boolean;
  created_at: string;
};

/**
 * Every principal with its email address, through admin_list_user_account(): email is identity,
 * kept in auth.users, which PostgREST cannot read. Administrators only.
 */
export async function listUserAccount(supabase: SupabaseClient): Promise<QueryResult<UserAccountRow[]>> {
  const { data, error } = await supabase.rpc('admin_list_user_account');
  if (error) return { data: null, error };
  return {
    data: (data as UserAccountListRecord[]).map((row) => ({
      // bigint values from SQL functions can arrive as strings.
      id: Number(row.id),
      emailAddress: row.email_address,
      admin: row.admin,
      createdAt: row.created_at,
    })),
    error: null,
  };
}

/** Promotes or demotes an administrator. The RPC refuses to demote the last one. */
export async function setUserAccountAdmin(
  supabase: SupabaseClient,
  id: number,
  admin: boolean
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('admin_set_user_admin', { p_user_account_id: id, p_admin: admin });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
