import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { InboundReceiptRow, ReceiveQueueView } from '@sveltebuilder/logistic/views';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }): Promise<ReceiveQueueView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const columns =
    'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, supplier(id, slug, lead_time_day, active, created_at), inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at)';

  // Two queries rather than one filtered in JS: the work queue and the recently-finished
  // list want different statuses, different orders and different sizes, and asking the
  // database for each is cheaper than fetching fifty rows to divide them up here — which is
  // what the original did, and it silently capped both lists at whatever the first fifty
  // happened to contain.
  const [activeResult, recentResult, copy] = await Promise.all([
    locals.supabase
      .from('inbound_receipt')
      .select(columns)
      .in('status', ['pending', 'partial'])
      .order('expected_at', { ascending: true, nullsFirst: false })
      .limit(50),
    locals.supabase
      .from('inbound_receipt')
      .select(columns)
      .eq('status', 'complete')
      .order('received_at', { ascending: false })
      .limit(5),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (activeResult.error) throw error(500, 'Failed to load the receiving queue.');
  if (recentResult.error) throw error(500, 'Failed to load recent receipts.');

  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

  type Row = NonNullable<typeof activeResult.data>[number];

  const toReceipt = (row: Row): InboundReceiptRow => {
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

  return {
    active: (activeResult.data ?? []).map(toReceipt),
    recent: (recentResult.data ?? []).map(toReceipt),
    localeCode: locals.locale.code,
    copy,
  };
};
