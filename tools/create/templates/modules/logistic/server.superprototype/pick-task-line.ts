import type { SupabaseClient } from '@supabase/supabase-js';
import type { PickTaskLine } from '@sveltebuilder/logistic';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * The line, only if it is on this task, so a crafted post cannot reach a line on someone
 * else's task even where a policy would allow the row.
 */
export async function getPickTaskLine(
  supabase: SupabaseClient,
  pickTaskId: number,
  id: number
): Promise<QueryResult<Pick<PickTaskLine, 'id'> | null>> {
  const { data, error } = await supabase
    .from('pick_task_line')
    .select('id')
    .eq('id', id)
    .eq('pick_task_id', pickTaskId)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Updates the line and consumes the stock physically taken. See the RPC's comment in
 * supabase/supplemental/05-logistic-supplements.sql for why consuming rather than adjusting is
 * the distinction that matters. Raises 42501 when the task is not the caller's, and P0001 or
 * 23514 when the quantity is more than the line asked for.
 */
export async function recordPickTaskLineQuantity(
  supabase: SupabaseClient,
  line: { id: number; pickedQuantity: number; userAccountId: number }
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('logistic_record_picked_quantity', {
    p_line_id: line.id,
    p_picked_quantity: line.pickedQuantity,
    p_user_account_id: line.userAccountId,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
