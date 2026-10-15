import { error } from '@sveltejs/kit';
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
import { formError } from '$lib/server/form-error';

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

    if (!Number.isInteger(storageLocationId)) return formError(422, 'logistic.error.storage_location_required');
    if (!sku) return formError(422, 'logistic.error.sku_required');
    if (!Number.isInteger(expectedQuantity) || expectedQuantity <= 0) {
      return formError(422, 'logistic.error.expected_quantity_invalid');
    }

    const { error: insertError } = await addInboundReceiptLine(locals.supabase, {
      inboundReceiptId: receiptId,
      storageLocationId,
      sku,
      expectedQuantity,
    });

    if (insertError) return formError(500, 'logistic.error.line_add_failed');

    return { success: true as const };
  },

  receiveInboundReceiptLine: async ({ locals, params, request }) => {
    const receiptId = Number(params.id);
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const lineId = Number(form.get('inbound_receipt_line_id'));
    const receivedQuantity = Number(form.get('received_quantity'));

    if (!Number.isInteger(lineId)) return formError(422, 'logistic.error.line_invalid');
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return formError(422, 'logistic.error.received_quantity_invalid');
    }

    const { data: line, error: lineError } = await getInboundReceiptLine(
      locals.supabase,
      receiptId,
      lineId
    );

    if (lineError) return formError(500, 'logistic.error.line_load_failed');
    if (line === null) return formError(404, 'logistic.error.inbound_receipt_line_mismatch');

    const { error: rpcError } = await receiveInboundReceiptLine(locals.supabase, {
      id: lineId,
      receivedQuantity,
      userAccountId: locals.userAccountId,
    });

    if (rpcError) {
      // The receipt is already completed or cancelled. That is an answer to the
      // operator, not a fault.
      if (rpcError.code === '42501') {
        return formError(409, 'logistic.error.inbound_receipt_closed');
      }
      return formError(500, 'logistic.error.received_quantity_save_failed');
    }

    return { success: true as const };
  },
};
