import { error, fail } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { ShipmentStatus } from '@sveltebuilder/logistic';
import type { ShipmentDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'created',
  'packed',
  'dispatched',
  'in_transit',
  'delivered',
  'exception',
];

export const load: PageServerLoad = async ({ locals, params }): Promise<ShipmentDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [shipmentResult, copy] = await Promise.all([
    locals.supabase
      .from('shipment')
      .select(
        'id, user_account_id, status, carrier, service_level, tracking_number, shipped_at, delivered_at, created_at, updated_at, shipment_line(id, shipment_id, pick_task_line_id, sku, quantity, created_at), tracking_event(id, shipment_id, status, event_location, description, occurred_at, created_at)'
      )
      .eq('id', id)
      .maybeSingle(),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (shipmentResult.error) throw error(500, 'Failed to load the shipment.');
  // Null also covers "RLS refused the row", which is the right answer either way.
  if (!shipmentResult.data) throw error(404, 'Shipment not found.');

  const row = shipmentResult.data;

  return {
    shipment: {
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
      lines: (row.shipment_line ?? []).map((line) => ({
        id: line.id,
        shipmentId: line.shipment_id,
        pickTaskLineId: line.pick_task_line_id,
        sku: line.sku,
        quantity: line.quantity,
        createdAt: line.created_at,
      })),
      // Newest first, sorted here rather than in the query: a carrier's own event order
      // is not dependable and the embed has no ordering of its own to rely on.
      trackingEvents: (row.tracking_event ?? [])
        .map((event) => ({
          id: event.id,
          shipmentId: event.shipment_id,
          status: event.status,
          eventLocation: event.event_location,
          description: event.description,
          occurredAt: event.occurred_at,
          createdAt: event.created_at,
        }))
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    },
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
      return fail(422, { error: 'Choose a valid status.' });
    }

    // shipped_at and delivered_at are stamped when the shipment reaches those states and
    // cleared when it leaves them, so a correction does not leave a delivery date on a
    // shipment that is back in transit.
    const { error: updateError } = await locals.supabase
      .from('shipment')
      .update({
        status,
        shipped_at: status === 'dispatched' ? new Date().toISOString() : null,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (updateError) return fail(500, { error: 'Failed to update the status.' });

    return { success: true as const };
  },

  updateTracking: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();

    const { error: updateError } = await locals.supabase
      .from('shipment')
      .update({
        carrier: (form.get('carrier') as string | null)?.trim() || null,
        service_level: (form.get('service_level') as string | null)?.trim() || null,
        tracking_number: (form.get('tracking_number') as string | null)?.trim() || null,
      })
      .eq('id', id);

    if (updateError) return fail(500, { error: 'Failed to save the tracking details.' });

    return { success: true as const };
  },

  addEvent: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();
    const status = (form.get('status') as string | null)?.trim();
    if (!status) return fail(422, { error: 'An event needs a status.' });

    // tracking_event.status is free text, not the shipment enum: it records what a
    // carrier called the scan, which no enum of ours can enumerate.
    const { error: insertError } = await locals.supabase.from('tracking_event').insert({
      shipment_id: id,
      status,
      event_location: (form.get('event_location') as string | null)?.trim() || null,
      description: (form.get('description') as string | null)?.trim() || null,
    });

    if (insertError) return fail(500, { error: 'Failed to add the tracking event.' });

    return { success: true as const };
  },
};
