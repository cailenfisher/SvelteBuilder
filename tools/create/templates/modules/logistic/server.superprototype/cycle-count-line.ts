import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * Records what a counter saw on one line. One statement: recording moves no stock, and the
 * variance is applied later, all at once, when an admin approves the count. Scoped to the
 * count as well as the line, so a crafted post cannot reach another count's line. False when
 * no row was updated, which means RLS refused it: the count is not this worker's.
 */
export async function recordCycleCountLineQuantity(
  supabase: SupabaseClient,
  cycleCountId: number,
  line: { id: number; countedQuantity: number }
): Promise<QueryResult<boolean>> {
  const { data, error } = await supabase
    .from('cycle_count_line')
    .update({ counted_quantity: line.countedQuantity })
    .eq('id', line.id)
    .eq('cycle_count_id', cycleCountId)
    .select('id');
  if (error) return { data: null, error };
  return { data: data.length > 0, error: null };
}
