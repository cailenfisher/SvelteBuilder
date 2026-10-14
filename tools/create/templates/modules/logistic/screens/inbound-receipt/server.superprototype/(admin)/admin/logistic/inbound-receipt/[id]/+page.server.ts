import { error, fail } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  addInboundReceiptLine,
  getInboundReceiptLine,
  receiveInboundReceiptLine,
} from '$lib/server/logistic/inbound-receipt-line';
import { getInboundReceipt } from '$lib/server/logistic/inbound-receipt';
import { listStorageLocationOption } from '$lib/server/logistic/storage-location';
import type { InboundReceiptDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
  params,
}): Promise<InboundReceiptDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [receiptResult, locationsResult, copy] = await Promise.all([
    getInboundReceipt(locals.supabase, id),
    // Only bins can hold stock; the screen filters no further, so the loader does not
    // ship what it cannot use.
    listStorageLocationOption(locals.supabase, 'bin'),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (receiptResult.error) throw error(500, 'Failed to load the receipt.');
  // Null also covers "RLS refused the row", which is the right answer either way.
  if (!receiptResult.data) throw error(404, 'Receipt not found.');
  if (locationsResult.error) throw error(500, 'Failed to load storage locations.');

  const inboundReceipt = receiptResult.data;

  return {
    inboundReceipt: {
      ...inboundReceipt,
      lines: [...inboundReceipt.lines].sort((a, b) => a.id - b.id),
    },
    storageLocations: locationsResult.data,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  addInboundReceiptLine: async ({ locals, params, request }) => {
    const receiptId = Number(params.id);
    if (!Number.isInteger(receiptId)) throw error(404, 'Not found.');

    const form = await request.formData();
    const storageLocationId = Number(form.get('storage_location_id'));
    const sku = (form.get('sku') as string | null)?.trim();
    const expectedQuantity = Number(form.get('expected_quantity'));

    if (!Number.isInteger(storageLocationId)) return fail(422, { error: 'Choose a location.' });
    if (!sku) return fail(422, { error: 'SKU is required.' });
    if (!Number.isInteger(expectedQuantity) || expectedQuantity <= 0) {
      return fail(422, { error: 'Expected quantity must be a positive whole number.' });
    }

    const { error: insertError } = await addInboundReceiptLine(locals.supabase, {
      inboundReceiptId: receiptId,
      storageLocationId,
      sku,
      expectedQuantity,
    });

    if (insertError) return fail(500, { error: 'Failed to add the line.' });

    return { success: true as const };
  },

  receiveInboundReceiptLine: async ({ locals, params, request }) => {
    const receiptId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('inbound_receipt_line_id'));
    const receivedQuantity = Number(form.get('received_quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return fail(422, { error: 'Received quantity must be zero or a positive whole number.' });
    }

    const { data: line, error: lineError } = await getInboundReceiptLine(
      locals.supabase,
      receiptId,
      lineId
    );

    if (lineError) return fail(500, { error: 'Failed to load the line.' });
    if (line === null) return fail(404, { error: 'That line is not on this receipt.' });

    const { error: rpcError } = await receiveInboundReceiptLine(locals.supabase, {
      id: lineId,
      receivedQuantity,
      userAccountId: locals.userAccountId,
    });

    if (rpcError) {
      // The receipt is already completed or cancelled. That is an answer to the
      // operator, not a fault.
      if (rpcError.code === '42501') {
        return fail(409, { error: 'This receipt is no longer open for receiving.' });
      }
      return fail(500, { error: 'Failed to record the received quantity.' });
    }

    return { success: true as const };
  },
};
