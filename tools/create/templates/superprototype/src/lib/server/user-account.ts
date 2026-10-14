import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserAccount } from '$lib/server/schema';
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
