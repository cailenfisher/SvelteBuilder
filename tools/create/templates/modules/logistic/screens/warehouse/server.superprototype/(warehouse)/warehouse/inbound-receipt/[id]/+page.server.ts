import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  getInboundReceiptLine,
  receiveInboundReceiptLine,
} from '$lib/server/logistic/inbound-receipt-line';
import { getInboundReceipt } from '$lib/server/logistic/inbound-receipt';
import type { InboundReceiptWarehouseDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
  params,
}): Promise<InboundReceiptWarehouseDetailView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [receiptResult, copy] = await Promise.all([
    getInboundReceipt(locals.supabase, id),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (receiptResult.error) throw error(500, 'Failed to load the receipt.');
  if (!receiptResult.data) throw error(404, 'Receipt not found.');

  const inboundReceipt = receiptResult.data;
  if (inboundReceipt.status === 'cancelled') throw error(410, 'That receipt has been cancelled.');

  return {
    inboundReceipt: {
      ...inboundReceipt,
      // Grouped by location so a receiver puts away one bin at a time rather than walking back.
      lines: [...inboundReceipt.lines].sort(
        (a, b) => a.storageLocationId - b.storageLocationId || a.sku.localeCompare(b.sku)
      ),
    },
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // The same RPC the admin receipt screen uses. Its worker RLS policy is what allows a
  // non-admin here: receipts still pending or partial only, which is also why a cancelled
  // receipt is refused above rather than merely hidden.
  receive: async ({ locals, params, request }) => {
    const receiptId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('inbound_receipt_line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail(422, { error: 'Enter zero or a positive whole number.' });
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
      receivedQuantity: quantity,
      userAccountId: locals.userAccountId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(409, { error: 'This receipt is no longer open for receiving.' });
      }
      return fail(500, { error: 'Failed to record the received quantity.' });
    }

    return { success: true as const };
  },
};
