import type { SupabaseClient } from '@supabase/supabase-js';
import type { InboundReceiptLine } from '@sveltebuilder/logistic';
import type { QueryResult } from '$lib/server/postgrest';

/**
 * One insert. The receipt's status is not touched: an expected line that has received nothing
 * leaves the receipt pending, which is what the status already says.
 */
export async function addInboundReceiptLine(
  supabase: SupabaseClient,
  fields: Pick<
    InboundReceiptLine,
    'inboundReceiptId' | 'storageLocationId' | 'sku' | 'expectedQuantity'
  >
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('inbound_receipt_line').insert({
    inbound_receipt_id: fields.inboundReceiptId,
    storage_location_id: fields.storageLocationId,
    sku: fields.sku,
    expected_quantity: fields.expectedQuantity,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/**
 * The line, only if it is on this receipt. RLS permits an admin to receive any line, so
 * narrowing a crafted post to the receipt on screen is the caller's job, and this is how it
 * does it.
 */
export async function getInboundReceiptLine(
  supabase: SupabaseClient,
  inboundReceiptId: number,
  id: number
): Promise<QueryResult<Pick<InboundReceiptLine, 'id'> | null>> {
  const { data, error } = await supabase
    .from('inbound_receipt_line')
    .select('id')
    .eq('id', id)
    .eq('inbound_receipt_id', inboundReceiptId)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

/**
 * Five statements across three tables (move stock, update the line, recompute the receipt's
 * status), so an RPC. See the function's own comment in
 * supabase/supplemental/05-logistic-supplements.sql for why it is SECURITY INVOKER and why its
 * statement order matters. It raises 42501 (insufficient_privilege) when RLS refused the line
 * update: a receipt already completed or cancelled.
 */
export async function receiveInboundReceiptLine(
  supabase: SupabaseClient,
  line: { id: number; receivedQuantity: number; userAccountId: number }
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('logistic_receive_receipt_line', {
    p_line_id: line.id,
    p_received_quantity: line.receivedQuantity,
    p_user_account_id: line.userAccountId,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
