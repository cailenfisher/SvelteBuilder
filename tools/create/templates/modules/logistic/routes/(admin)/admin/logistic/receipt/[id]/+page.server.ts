import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getInboundReceipt,
  getStorageLocations,
  addInboundReceiptLine,
  receiveReceiptLine,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const [receipt, locations] = await Promise.all([
    getInboundReceipt(locals.supabase, id, locals.locale.code),
    getStorageLocations(locals.supabase, { active: true }),
  ]);

  if (!receipt) throw error(404, 'Receipt not found');

  return { receipt, locations, locale: locals.locale };
};

export const actions: Actions = {
  addLine: async ({ locals, params, request }) => {
    const receiptId = Number(params.id);
    const data = await request.formData();

    await addInboundReceiptLine(locals.supabase, {
      inboundReceiptId: receiptId,
      storageLocationId: Number(data.get('storage_location_id')),
      sku: data.get('sku') as string,
      expectedQuantity: Number(data.get('expected_quantity')),
    });

    return { success: true };
  },

  receiveLine: async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const lineId = Number(data.get('line_id'));
    const receivedQuantity = Number(data.get('received_quantity'));

    await receiveReceiptLine(
      locals.supabase,
      lineId,
      receivedQuantity,
      session.user.id,
    );

    return { success: true };
  },
};
