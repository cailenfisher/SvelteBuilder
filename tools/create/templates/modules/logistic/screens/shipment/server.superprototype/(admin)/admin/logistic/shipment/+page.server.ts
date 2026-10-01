import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { ShipmentStatus } from '@sveltebuilder/logistic';
import type { ShipmentListView, ShipmentRow } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'created',
  'packed',
  'dispatched',
  'in_transit',
  'delivered',
  'exception',
];

export const load: PageServerLoad = async ({ locals, url }): Promise<ShipmentListView> => {
  // Validated against the enum rather than cast: a query string is user input, and
  // PostgREST answers an unknown enum value with a 400 the screen cannot explain.
  const statusParam = url.searchParams.get('status');
  const status = SHIPMENT_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const from = (page - 1) * PER_PAGE;

  let query = locals.supabase
    .from('shipment')
    .select(
      'id, user_account_id, status, carrier, service_level, tracking_number, shipped_at, delivered_at, created_at, updated_at, shipment_line(count)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1);

  if (status !== null) query = query.eq('status', status);

  const [shipmentsResult, copy] = await Promise.all([
    query,
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (shipmentsResult.error) throw error(500, 'Failed to load shipments.');

  const shipments: ShipmentRow[] = (shipmentsResult.data ?? []).map((row) => ({
    id: row.id,
    userAccountId: row.user_account_id,
    status: row.status,
    carrier: row.carrier,
    serviceLevel: row.service_level,
    trackingNumber: row.tracking_number,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // An aggregate embed arrives as a one-element array of { count }. The list shows how
    // many lines a shipment has, not what they are, so a count is all it needs — unlike
    // the receipt list, where the card computes totals from the lines themselves.
    lineCount: row.shipment_line?.[0]?.count ?? 0,
  }));

  return {
    shipments,
    total: shipmentsResult.count ?? shipments.length,
    page,
    perPage: PER_PAGE,
    status,
    statuses: SHIPMENT_STATUSES,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // Two statements — the shipment and its lines — and the detail screen offers no way to
  // add a line afterwards, so a shipment created without one would be stranded. Hence an
  // RPC rather than two calls. SECURITY INVOKER, so RLS still checks both inserts.
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const sku = (form.get('sku') as string | null)?.trim();
    const quantity = Number(form.get('quantity'));

    if (!sku) return fail(422, { error: 'SKU is required.' });
    if (!Number.isInteger(quantity) || quantity < 1) {
      return fail(422, { error: 'Quantity must be a positive whole number.' });
    }

    const { data, error: rpcError } = await locals.supabase.rpc('logistic_create_shipment', {
      p_user_account_id: locals.userAccountId,
      p_skus: [sku],
      p_quantities: [quantity],
      p_carrier: (form.get('carrier') as string | null)?.trim() || null,
      p_service_level: (form.get('service_level') as string | null)?.trim() || null,
    });

    if (rpcError || data === null) return fail(500, { error: 'Failed to create the shipment.' });

    redirect(303, `/admin/logistic/shipment/${data}`);
  },
};
