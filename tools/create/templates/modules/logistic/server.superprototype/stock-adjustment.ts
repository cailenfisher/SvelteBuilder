import type { SupabaseClient } from '@supabase/supabase-js';
import type { StockAdjustment } from '@sveltebuilder/logistic';
import type { QueryResult } from '$lib/server/postgrest';

/** A stock level's most recent adjustments, newest first. */
export async function listStockAdjustment(
  supabase: SupabaseClient,
  stockLevelId: number,
  limit: number
): Promise<QueryResult<StockAdjustment[]>> {
  const { data, error } = await supabase
    .from('stock_adjustment')
    .select(
      'id, stock_level_id, user_account_id, delta, on_hand_before, on_hand_after, reason, note, created_at'
    )
    .eq('stock_level_id', stockLevelId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { data: null, error };
  return {
    data: data.map((row) => ({
      id: row.id,
      stockLevelId: row.stock_level_id,
      userAccountId: row.user_account_id,
      delta: row.delta,
      onHandBefore: row.on_hand_before,
      onHandAfter: row.on_hand_after,
      reason: row.reason,
      note: row.note,
      createdAt: row.created_at,
    })),
    error: null,
  };
}
