import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { InboundReceiptStatus } from '@sveltebuilder/logistic';
import type {
  EntityOption,
  InboundReceiptListView,
  InboundReceiptRow,
} from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

const RECEIPT_STATUSES: InboundReceiptStatus[] = ['pending', 'partial', 'complete', 'cancelled'];

export const load: PageServerLoad = async ({ locals, url }): Promise<InboundReceiptListView> => {
  // Validated against the enum rather than cast: a query string is user input, and
  // PostgREST would reject an unknown enum value with a 400 the screen cannot explain.
  const statusParam = url.searchParams.get('status');
  const status = RECEIPT_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const from = (page - 1) * PER_PAGE;

  let query = locals.supabase
    .from('inbound_receipt')
    .select(
      'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, supplier(id, slug, lead_time_day, active, created_at), inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1);

  if (status !== null) query = query.eq('status', status);

  const [receiptsResult, suppliersResult, copy] = await Promise.all([
    query,
    locals.supabase.from('supplier').select('id, slug').eq('active', true).order('slug'),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (receiptsResult.error) throw error(500, 'Failed to load receipts.');
  if (suppliersResult.error) throw error(500, 'Failed to load suppliers.');

  // supplier is a to-one embed, which supabase-js types as an array because it cannot
  // know the relation's cardinality without generated types. Null is meaningful here
  // rather than an oversight: a blind receipt has no supplier.
  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

  const receipts: InboundReceiptRow[] = (receiptsResult.data ?? []).map((row) => {
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

  const suppliers: EntityOption[] = (suppliersResult.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
  }));

  return {
    receipts,
    total: receiptsResult.count ?? receipts.length,
    page,
    perPage: PER_PAGE,
    status,
    suppliers,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // One insert, so a plain call. A receipt carries no copy of its own — it is identified
  // by its id and its supplier — so unlike creating a supplier there is nothing to keep
  // atomic with it.
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const supplierRaw = (form.get('supplier_id') as string | null)?.trim();
    const expectedAt = (form.get('expected_at') as string | null)?.trim() || null;
    const note = (form.get('note') as string | null)?.trim() || null;

    // No supplier is not a missing field: a blind receipt is goods arriving with no
    // purchase order to match them to, which the schema allows by design.
    const supplierId = supplierRaw ? Number(supplierRaw) : null;
    if (supplierId !== null && !Number.isInteger(supplierId)) {
      return fail(422, { error: 'Invalid supplier.' });
    }

    const { data, error: insertError } = await locals.supabase
      .from('inbound_receipt')
      .insert({
        supplier_id: supplierId,
        user_account_id: locals.userAccountId,
        expected_at: expectedAt,
        note,
      })
      .select('id')
      .single();

    if (insertError || data === null) return fail(500, { error: 'Failed to create the receipt.' });

    redirect(303, `/admin/logistic/receipt/${data.id}`);
  },
};
