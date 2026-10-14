import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReturnAuthorization, ReturnAuthorizationStatus } from '@sveltebuilder/logistic';
import type {
  ReturnAuthorizationDetailView,
  ReturnAuthorizationRow,
} from '@sveltebuilder/logistic/views';
import type { CountedRows, QueryRange, QueryResult } from '$lib/server/postgrest';

/** Returns newest first, optionally of one status, with the total matching. */
export async function listReturnAuthorization(
  supabase: SupabaseClient,
  filter: { status: ReturnAuthorizationStatus | null },
  range: QueryRange
): Promise<QueryResult<CountedRows<ReturnAuthorizationRow>>> {
  let query = supabase
    .from('return_authorization')
    .select(
      'id, shipment_id, user_account_id, status, reason, note, created_at, updated_at, return_authorization_line(count)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(range.offset, range.offset + range.limit - 1);
  if (filter.status !== null) query = query.eq('status', filter.status);

  const { data, error, count } = await query;
  if (error) return { data: null, error };

  const returnAuthorizations: ReturnAuthorizationRow[] = data.map((row) => ({
    id: row.id,
    shipmentId: row.shipment_id,
    userAccountId: row.user_account_id,
    status: row.status,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineCount: row.return_authorization_line?.[0]?.count ?? 0,
  }));
  return {
    data: { rows: returnAuthorizations, total: count ?? returnAuthorizations.length },
    error: null,
  };
}

/** A return with its lines in the order they were added. */
export async function getReturnAuthorization(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<ReturnAuthorizationDetailView['returnAuthorization'] | null>> {
  const { data: row, error } = await supabase
    .from('return_authorization')
    .select(
      'id, shipment_id, user_account_id, status, reason, note, created_at, updated_at, return_authorization_line(id, return_authorization_id, shipment_line_id, sku, expected_quantity, received_quantity, condition, disposition, created_at)'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  if (row === null) return { data: null, error: null };

  return {
    data: {
      id: row.id,
      shipmentId: row.shipment_id,
      userAccountId: row.user_account_id,
      status: row.status,
      reason: row.reason,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines: (row.return_authorization_line ?? [])
        .map((line) => ({
          id: line.id,
          returnAuthorizationId: line.return_authorization_id,
          shipmentLineId: line.shipment_line_id,
          sku: line.sku,
          expectedQuantity: line.expected_quantity,
          receivedQuantity: line.received_quantity,
          condition: line.condition,
          disposition: line.disposition,
          createdAt: line.created_at,
        }))
        .sort((a, b) => a.id - b.id),
    },
    error: null,
  };
}

/**
 * Two statements (the authorization and its lines), so an RPC: a return with no lines has
 * nothing to grade and no way back. Returns the new return's id.
 */
export async function createReturnAuthorization(
  supabase: SupabaseClient,
  fields: Pick<ReturnAuthorization, 'userAccountId' | 'reason' | 'note'> & {
    skus: string[];
    quantities: number[];
  }
): Promise<QueryResult<number | null>> {
  const { data, error } = await supabase.rpc('logistic_create_return_authorization', {
    p_user_account_id: fields.userAccountId,
    p_skus: fields.skus,
    p_quantities: fields.quantities,
    p_reason: fields.reason,
    p_note: fields.note,
  });
  if (error) return { data: null, error };
  return { data: data as number | null, error: null };
}

/**
 * One statement. Marking a return processed is a bookkeeping transition: every line's
 * disposition has already moved whatever stock it was going to move.
 */
export async function processReturnAuthorization(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<null>> {
  const { error } = await supabase
    .from('return_authorization')
    .update({ status: 'processed' })
    .eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}
