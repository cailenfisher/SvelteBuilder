import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getInboundReceipt,
  getStorageLocations,
  addInboundReceiptLine,
  receiveReceiptLine,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const { receipt, locations } = await locals.db.withUser(async (tx) => {
    const [receipt, locations] = await Promise.all([
      getInboundReceipt(tx, id, locals.locale.code),
      getStorageLocations(tx, { active: true }),
    ]);
    return { receipt, locations };
  });

  if (!receipt) throw error(404, 'Receipt not found');

  return { receipt, locations, locale: locals.locale };
};

export const actions: Actions = {
  addLine: async ({ locals, params, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const receiptId = Number(params.id);
    const data = await request.formData();

    await locals.db.withUser((tx) =>
      addInboundReceiptLine(tx, {
        inboundReceiptId: receiptId,
        storageLocationId: Number(data.get('storage_location_id')),
        sku: data.get('sku') as string,
        expectedQuantity: Number(data.get('expected_quantity')),
      }),
    );

    return { success: true };
  },

  receiveLine: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const lineId = Number(data.get('line_id'));
    const receivedQuantity = Number(data.get('received_quantity'));

    await locals.db.withUser((tx) =>
      receiveReceiptLine(tx, lineId, receivedQuantity, userAccountId),
    );

    return { success: true };
  },
};
