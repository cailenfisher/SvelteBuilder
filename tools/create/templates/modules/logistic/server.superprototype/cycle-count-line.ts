import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * Records what a counter saw on one line (logistic_record_counted_quantity, which takes
 * `cycle_count.count`). Only the counted quantity changes; what the count expected cannot.
 * Recording moves no stock: the variance is applied, all at once, when the count is approved.
 * False when the line is not on that count, or the count is not the caller's and in progress.
 */
export async function recordCycleCountLineQuantity(
  supabase: SupabaseClient,
  cycleCountId: number,
  line: { id: number; countedQuantity: number }
): Promise<QueryResult<boolean>> {
  const { data, error } = await supabase.rpc('logistic_record_counted_quantity', {
    p_cycle_count_id: cycleCountId,
    p_line_id: line.id,
    p_counted_quantity: line.countedQuantity,
  });
  if (error) return { data: null, error };
  return { data: data === true, error: null };
}
