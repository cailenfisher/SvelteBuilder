import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { InboundReceiptLineRow, ReceiveDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }): Promise<ReceiveDetailView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [receiptResult, copy] = await Promise.all([
    locals.supabase
      .from('inbound_receipt')
      .select(
        'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at, storage_location!inner(id, slug, location_type))'
      )
      .eq('id', id)
      .maybeSingle(),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (receiptResult.error) throw error(500, 'Failed to load the receipt.');
  if (!receiptResult.data) throw error(404, 'Receipt not found.');

  const row = receiptResult.data;
  if (row.status === 'cancelled') throw error(410, 'That receipt has been cancelled.');

  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

  const lines: InboundReceiptLineRow[] = [];
  for (const line of row.inbound_receipt_line ?? []) {
    const location = toOne(line.storage_location);
    if (location === null) continue;
    lines.push({
      id: line.id,
      inboundReceiptId: line.inbound_receipt_id,
      storageLocationId: line.storage_location_id,
      sku: line.sku,
      expectedQuantity: line.expected_quantity,
      receivedQuantity: line.received_quantity,
      discrepancy: line.discrepancy,
      createdAt: line.created_at,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }
  // Grouped by location so a receiver puts away one bin at a time rather than walking back.
  lines.sort((a, b) => a.storageLocationId - b.storageLocationId || a.sku.localeCompare(b.sku));

  return {
    receipt: {
      id: row.id,
      supplierId: row.supplier_id,
      userAccountId: row.user_account_id,
      status: row.status,
      expectedAt: row.expected_at,
      receivedAt: row.received_at,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines,
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
    const lineId = Number(form.get('line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail(422, { error: 'Enter zero or a positive whole number.' });
    }

    const { data: line, error: lineError } = await locals.supabase
      .from('inbound_receipt_line')
      .select('id')
      .eq('id', lineId)
      .eq('inbound_receipt_id', receiptId)
      .maybeSingle();

    if (lineError) return fail(500, { error: 'Failed to load the line.' });
    if (line === null) return fail(404, { error: 'That line is not on this receipt.' });

    const { error: rpcError } = await locals.supabase.rpc('logistic_receive_receipt_line', {
      p_line_id: lineId,
      p_received_quantity: quantity,
      p_user_account_id: locals.userAccountId,
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
