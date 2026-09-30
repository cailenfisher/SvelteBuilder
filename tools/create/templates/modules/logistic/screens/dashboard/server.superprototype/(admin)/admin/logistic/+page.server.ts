import { error } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { PickTask } from '@sveltebuilder/logistic';
import type {
  InboundReceiptRow,
  LogisticDashboardView,
  ReturnAuthorizationRow,
  StockLevelRow,
} from '@sveltebuilder/logistic/views';
import type { PageServerLoad } from './$types';

// Guards live in the (admin) layout load. This screen writes nothing, so it has no actions.

const PREVIEW = 5;

export const load: PageServerLoad = async ({ locals }): Promise<LogisticDashboardView> => {
  const receiptColumns =
    'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, supplier(id, slug, lead_time_day, active, created_at), inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at)';

  const [receiptsResult, tasksResult, returnsResult, stockResult, cycleCountResult, copy] =
    await Promise.all([
      // `count: 'exact'` alongside a limited range gives both the preview rows and the true
      // total in one round trip, which is why each of these is a single query rather than a
      // count query and a rows query.
      locals.supabase
        .from('inbound_receipt')
        .select(receiptColumns, { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(PREVIEW),
      locals.supabase
        .from('pick_task')
        .select('id, user_account_id, status, created_at, updated_at', { count: 'exact' })
        .eq('status', 'open')
        .order('created_at')
        .limit(PREVIEW),
      locals.supabase
        .from('return_authorization')
        .select(
          'id, shipment_id, user_account_id, status, reason, note, created_at, updated_at, return_authorization_line(count)',
          { count: 'exact' }
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(PREVIEW),
      // Low stock cannot be filtered in PostgREST: the predicate compares on_hand - reserved
      // against reorder_point, three columns of the same row. So the rows with a threshold set
      // are fetched and filtered here. Only rows with a reorder_point can qualify, which is
      // what keeps this from being a full table scan of the warehouse.
      locals.supabase
        .from('stock_level')
        .select(
          'id, storage_location_id, sku, on_hand, reserved, reorder_point, created_at, updated_at, storage_location!inner(id, slug, location_type)'
        )
        .not('reorder_point', 'is', null)
        .order('sku'),
      locals.supabase
        .from('cycle_count')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']),
      loadScopedCopy(
        locals.supabase,
        ['logistic', 'supplier', 'storage_location'],
        locals.locale.code,
        locals.defaultLocale.code
      ),
    ]);

  if (receiptsResult.error) throw error(500, 'Failed to load receipts.');
  if (tasksResult.error) throw error(500, 'Failed to load pick tasks.');
  if (returnsResult.error) throw error(500, 'Failed to load returns.');
  if (stockResult.error) throw error(500, 'Failed to load stock levels.');
  if (cycleCountResult.error) throw error(500, 'Failed to count cycle counts.');

  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

  const lowStockLevels: StockLevelRow[] = [];
  for (const row of stockResult.data ?? []) {
    const location = toOne(row.storage_location);
    if (location === null || row.reorder_point === null) continue;

    const available = row.on_hand - row.reserved;
    if (available > row.reorder_point) continue;

    lowStockLevels.push({
      id: row.id,
      storageLocationId: row.storage_location_id,
      sku: row.sku,
      onHand: row.on_hand,
      reserved: row.reserved,
      reorderPoint: row.reorder_point,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      available,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }

  const pendingReceipts: InboundReceiptRow[] = (receiptsResult.data ?? []).map((row) => {
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
  });

  const openPickTasks: PickTask[] = (tasksResult.data ?? []).map((row) => ({
    id: row.id,
    userAccountId: row.user_account_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const openReturns: ReturnAuthorizationRow[] = (returnsResult.data ?? []).map((row) => ({
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
    metrics: {
      openPickTaskCount: tasksResult.count ?? openPickTasks.length,
      pendingReceiptCount: receiptsResult.count ?? pendingReceipts.length,
      openReturnCount: returnsResult.count ?? openReturns.length,
      openCycleCountCount: cycleCountResult.count ?? 0,
      // Counted from the filtered set rather than a separate query, since the filter is the
      // part PostgREST cannot express.
      lowStockCount: lowStockLevels.length,
    },
    lowStockLevels: lowStockLevels.slice(0, PREVIEW),
    pendingReceipts,
    openPickTasks,
    openReturns,
    localeCode: locals.locale.code,
    copy,
  };
};
