import { error } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  getShipment,
  updateShipmentStatus,
  updateShipmentTracking,
} from '$lib/server/logistic/shipment';
import { addTrackingEvent } from '$lib/server/logistic/tracking-event';
import { SHIPMENT_STATUSES } from '@sveltebuilder/logistic';
import type { ShipmentStatus } from '@sveltebuilder/logistic';
import type { ShipmentDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';
import { listCurrentUserAction } from '$lib/server/permission';
import { requireScope } from '../../../require-access';

export const load: PageServerLoad = async ({ parent, locals, params }): Promise<ShipmentDetailView> => {
  await requireScope(parent, 'shipment');
  const { data: actions, error: actionError } = await listCurrentUserAction(locals.supabase, 'shipment');
  if (actionError) throw error(500, 'Failed to load your permissions.');

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [shipmentResult, copy] = await Promise.all([
    getShipment(locals.supabase, id),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (shipmentResult.error) throw error(500, 'Failed to load the shipment.');
  // Null also covers "RLS refused the row", which is the right answer either way.
  if (!shipmentResult.data) throw error(404, 'Shipment not found.');

  return {
    actions,
    shipment: shipmentResult.data,
    statuses: SHIPMENT_STATUSES,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // One statement each, so each is a plain call.
  updateStatus: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();
    const status = form.get('status') as ShipmentStatus | null;
    if (status === null || !SHIPMENT_STATUSES.includes(status)) {
      return formError(422, 'logistic.error.status_invalid');
    }

    const { error: updateError } = await updateShipmentStatus(locals.supabase, id, status);

    if (updateError) return formError(500, 'logistic.error.status_update_failed');

    return { success: true as const };
  },

  updateTracking: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();

    const { error: updateError } = await updateShipmentTracking(locals.supabase, id, {
      carrier: (form.get('carrier') as string | null)?.trim() || null,
      serviceLevel: (form.get('service_level') as string | null)?.trim() || null,
      trackingNumber: (form.get('tracking_number') as string | null)?.trim() || null,
    });

    if (updateError) return formError(500, 'logistic.error.tracking_save_failed');

    return { success: true as const };
  },

  addTrackingEvent: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();
    const status = (form.get('status') as string | null)?.trim();
    if (!status) return formError(422, 'logistic.error.tracking_event_status_required');

    const { error: insertError } = await addTrackingEvent(locals.supabase, {
      shipmentId: id,
      status,
      eventLocation: (form.get('event_location') as string | null)?.trim() || null,
      description: (form.get('description') as string | null)?.trim() || null,
    });

    if (insertError) return formError(500, 'logistic.error.tracking_event_add_failed');

    return { success: true as const };
  },
};
