import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getShipment,
  updateShipmentStatus,
  updateShipmentTracking,
  addTrackingEvent,
} from '@sveltebuilder/logistic/server';
import type { ShipmentStatus } from '@sveltebuilder/logistic';

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'created',
  'packed',
  'dispatched',
  'in_transit',
  'delivered',
  'exception',
];

export const load: PageServerLoad = async ({ locals, params }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const shipment = await locals.db.withUser((tx) => getShipment(tx, id));
  if (!shipment) throw error(404, 'Shipment not found');

  return { shipment, statuses: SHIPMENT_STATUSES, locale: locals.locale };
};

export const actions: Actions = {
  updateStatus: async ({ locals, params, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    const data = await request.formData();
    const status = data.get('status') as ShipmentStatus;

    if (!SHIPMENT_STATUSES.includes(status)) throw error(400, 'Invalid status');

    await locals.db.withUser((tx) => updateShipmentStatus(tx, id, status));
    return { success: true };
  },

  updateTracking: async ({ locals, params, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    const data = await request.formData();

    await locals.db.withUser((tx) =>
      updateShipmentTracking(tx, id, {
        carrier: (data.get('carrier') as string) || undefined,
        serviceLevel: (data.get('service_level') as string) || undefined,
        trackingNumber: (data.get('tracking_number') as string) || undefined,
      }),
    );

    return { success: true };
  },

  addEvent: async ({ locals, params, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    const data = await request.formData();
    const status = (data.get('status') as string)?.trim();

    if (!status) throw error(400, 'Event status is required');

    await locals.db.withUser((tx) =>
      addTrackingEvent(tx, {
        shipmentId: id,
        status,
        eventLocation: (data.get('event_location') as string) || undefined,
        description: (data.get('description') as string) || undefined,
      }),
    );

    return { success: true };
  },
};
