import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ReturnAuthorizationLine,
  ReturnCondition,
  ReturnDisposition,
} from '@sveltebuilder/logistic';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * The line, only if it is on this return. RLS permits an admin to grade any line, so narrowing
 * a crafted post to the return on screen is the caller's job, and this is how it does it.
 */
export async function getReturnAuthorizationLine(
  supabase: SupabaseClient,
  returnAuthorizationId: number,
  id: number
): Promise<QueryResult<Pick<ReturnAuthorizationLine, 'id'> | null>> {
  const { data, error } = await supabase
    .from('return_authorization_line')
    .select('id')
    .eq('id', id)
    .eq('return_authorization_id', returnAuthorizationId)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Updates the line and, for a restock, puts the goods away: two or four statements, so an
 * RPC. It takes `return_authorization.grade`, records any restock against the caller, and raises
 * 42501 without that, or when the return is no longer open for grading.
 */
export async function gradeReturnAuthorizationLine(
  supabase: SupabaseClient,
  line: {
    id: number;
    receivedQuantity: number;
    condition: ReturnCondition;
    disposition: ReturnDisposition;
    storageLocationId: number | null;
  }
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('logistic_grade_return_line', {
    p_line_id: line.id,
    p_received_quantity: line.receivedQuantity,
    p_condition: line.condition,
    p_disposition: line.disposition,
    p_storage_location_id: line.storageLocationId,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
