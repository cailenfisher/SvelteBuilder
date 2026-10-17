import type { SupabaseClient } from '@supabase/supabase-js';
import type { InboundReceipt, InboundReceiptStatus } from '@sveltebuilder/logistic';
import type {
  InboundReceiptDetailView,
  InboundReceiptLineRow,
  InboundReceiptRow,
} from '@sveltebuilder/logistic/views';
import { toOne, type CountedRows, type QueryRange, type QueryResult } from '$lib/server/postgrest';

const selectInboundReceiptRow = (supabase: SupabaseClient, count?: 'exact') =>
  supabase
    .from('inbound_receipt')
    .select(
      'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, supplier(id, slug, lead_time_day, active, created_at), inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at)',
      { count }
    );

type InboundReceiptRecord = NonNullable<
  Awaited<ReturnType<typeof selectInboundReceiptRow>>['data']
>[number];

const toInboundReceiptRow = (row: InboundReceiptRecord): InboundReceiptRow => {
  // A to-one embed, which supabase-js types as an array. Null is meaningful rather than an
  // oversight: a blind receipt, goods arriving with no purchase order, has no supplier.
  const supplier = toOne(row.supplier);
  return {
    id: row.id,
    supplierId: row.supplier_id,
    userAccountId: row.user_account_id,
    status: row.status,
    expectedAt: row.expected_at,
    receivedAt: row.received_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplier:
      supplier === null
        ? null
        : {
            id: supplier.id,
            slug: supplier.slug,
            leadTimeDay: supplier.lead_time_day,
            active: supplier.active,
            createdAt: supplier.created_at,
          },
    lines: (row.inbound_receipt_line ?? []).map((line) => ({
      id: line.id,
      inboundReceiptId: line.inbound_receipt_id,
      storageLocationId: line.storage_location_id,
      sku: line.sku,
      expectedQuantity: line.expected_quantity,
      receivedQuantity: line.received_quantity,
      discrepancy: line.discrepancy,
      createdAt: line.created_at,
    })),
  };
};

/** Receipts newest first, optionally of one status, with the total matching. */
export async function listInboundReceipt(
  supabase: SupabaseClient,
  filter: { status: InboundReceiptStatus | null },
  range: QueryRange
): Promise<QueryResult<CountedRows<InboundReceiptRow>>> {
  let query = selectInboundReceiptRow(supabase, 'exact')
    .order('created_at', { ascending: false })
    .range(range.offset, range.offset + range.limit - 1);
  if (filter.status !== null) query = query.eq('status', filter.status);

  const { data, error, count } = await query;
  if (error) return { data: null, error };
  return {
    data: { rows: data.map(toInboundReceiptRow), total: count ?? data.length },
    error: null,
  };
}

/** The receiving queue: receipts still pending or partly received, soonest expected first. */
export async function listActiveInboundReceipt(
  supabase: SupabaseClient,
  limit: number
): Promise<QueryResult<InboundReceiptRow[]>> {
  const { data, error } = await selectInboundReceiptRow(supabase)
    .in('status', ['pending', 'partial'])
    .order('expected_at', { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) return { data: null, error };
  return { data: data.map(toInboundReceiptRow), error: null };
}

/** The most recently completed receipts. */
export async function listRecentInboundReceipt(
  supabase: SupabaseClient,
  limit: number
): Promise<QueryResult<InboundReceiptRow[]>> {
  const { data, error } = await selectInboundReceiptRow(supabase)
    .eq('status', 'completed')
    .order('received_at', { ascending: false })
    .limit(limit);
  if (error) return { data: null, error };
  return { data: data.map(toInboundReceiptRow), error: null };
}

/**
 * A receipt with every line and its storage location, lines in the order the database
 * returns them; each screen sorts them for its own task. Null also covers "RLS refused the
 * row", which is the right answer either way.
 */
export async function getInboundReceipt(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<InboundReceiptDetailView['inboundReceipt'] | null>> {
  const { data: row, error } = await supabase
    .from('inbound_receipt')
    .select(
      'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at, storage_location!inner(id, slug, location_type))'
    )
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, error };
  if (row === null) return { data: null, error: null };

  const lines: InboundReceiptLineRow[] = [];
  for (const line of row.inbound_receipt_line ?? []) {
    const location = toOne(line.storage_location);
    if (location === null) continue;
    lines.push({
      id: line.id,
      inboundReceiptId: line.inbound_receipt_id,
      storageLocationId: line.storage_location_id,
      sku: line.sku,
      expectedQuantity: line.expected_quantity,
      receivedQuantity: line.received_quantity,
      discrepancy: line.discrepancy,
      createdAt: line.created_at,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }

  return {
    data: {
      id: row.id,
      supplierId: row.supplier_id,
      userAccountId: row.user_account_id,
      status: row.status,
      expectedAt: row.expected_at,
      receivedAt: row.received_at,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines,
    },
    error: null,
  };
}

/**
 * One insert: a receipt carries no copy of its own, identified by its id and its supplier, so
 * there is nothing to keep atomic with it. A null supplier is a blind receipt, which the schema
 * allows by design. Returns the new receipt's id.
 */
export async function createInboundReceipt(
  supabase: SupabaseClient,
  fields: Pick<InboundReceipt, 'supplierId' | 'userAccountId' | 'expectedAt' | 'note'>
): Promise<QueryResult<number>> {
  const { data, error } = await supabase
    .from('inbound_receipt')
    .insert({
      supplier_id: fields.supplierId,
      user_account_id: fields.userAccountId,
      expected_at: fields.expectedAt,
      note: fields.note,
    })
    .select('id')
    .single();
  if (error) return { data: null, error };
  return { data: data.id, error: null };
}
