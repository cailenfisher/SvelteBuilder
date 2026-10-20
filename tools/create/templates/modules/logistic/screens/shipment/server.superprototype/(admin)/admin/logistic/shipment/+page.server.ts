import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { createShipment, listShipment } from '$lib/server/logistic/shipment';
import { SHIPMENT_STATUSES } from '@sveltebuilder/logistic';
import type { ShipmentListView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';
import { listCurrentUserAction } from '$lib/server/permission';
import { requireScope } from '../../require-access';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ parent, locals, url }): Promise<ShipmentListView> => {
  await requireScope(parent, 'shipment');
  const { data: actions, error: actionError } = await listCurrentUserAction(locals.supabase, 'shipment');
  if (actionError) throw error(500, 'Failed to load your permissions.');

  // Validated against the enum rather than cast: a query string is user input, and
  // PostgREST answers an unknown enum value with a 400 the screen cannot explain.
  const statusParam = url.searchParams.get('status');
  const status = SHIPMENT_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [shipmentsResult, copy] = await Promise.all([
    listShipment(locals.supabase, { status }, { offset: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (shipmentsResult.error) throw error(500, 'Failed to load shipments.');

  return {
    actions,
    shipments: shipmentsResult.data.rows,
    total: shipmentsResult.data.total,
    page,
    perPage: PER_PAGE,
    status,
    statuses: SHIPMENT_STATUSES,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const sku = (form.get('sku') as string | null)?.trim();
    const quantity = Number(form.get('quantity'));

    if (!sku) return formError(422, 'logistic.error.sku_required');
    if (!Number.isInteger(quantity) || quantity < 1) {
      return formError(422, 'logistic.error.quantity_invalid');
    }

    const { data: shipmentId, error: rpcError } = await createShipment(locals.supabase, {
      skus: [sku],
      quantities: [quantity],
      carrier: (form.get('carrier') as string | null)?.trim() || null,
      serviceLevel: (form.get('service_level') as string | null)?.trim() || null,
    });

    if (rpcError || shipmentId === null) {
      return formError(500, 'logistic.error.shipment_create_failed');
    }

    redirect(303, `/admin/logistic/shipment/${shipmentId}`);
  },
};
