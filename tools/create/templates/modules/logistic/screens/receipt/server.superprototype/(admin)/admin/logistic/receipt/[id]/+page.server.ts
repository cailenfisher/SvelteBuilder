import { error, fail } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type {
  InboundReceiptDetailView,
  InboundReceiptLineRow,
  LocationOption,
} from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
  params,
}): Promise<InboundReceiptDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [receiptResult, locationsResult, copy] = await Promise.all([
    locals.supabase
      .from('inbound_receipt')
      .select(
        'id, supplier_id, user_account_id, status, expected_at, received_at, note, created_at, updated_at, inbound_receipt_line(id, inbound_receipt_id, storage_location_id, sku, expected_quantity, received_quantity, discrepancy, created_at, storage_location!inner(id, slug, location_type))'
      )
      .eq('id', id)
      .maybeSingle(),
    // Only bins can hold stock; the coarser levels of the tree are for navigation. The
    // screen filters no further, so the loader does not ship what it cannot use.
    locals.supabase
      .from('storage_location')
      .select('id, slug, location_type')
      .eq('active', true)
      .eq('location_type', 'bin')
      .order('sort_order'),
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

  const row = receiptResult.data;

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
  lines.sort((a, b) => a.id - b.id);

  const locations: LocationOption[] = (locationsResult.data ?? []).map((location) => ({
    id: location.id,
    slug: location.slug,
    locationType: location.location_type,
  }));

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
    locations,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // One insert. The receipt's status is not touched: an expected line that has received
  // nothing leaves the receipt pending, which is what the status already says.
  addLine: async ({ locals, params, request }) => {
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

    const { error: insertError } = await locals.supabase.from('inbound_receipt_line').insert({
      inbound_receipt_id: receiptId,
      storage_location_id: storageLocationId,
      sku,
      expected_quantity: expectedQuantity,
    });

    if (insertError) return fail(500, { error: 'Failed to add the line.' });

    return { success: true as const };
  },

  // Five statements across three tables — move stock, update the line, recompute the
  // receipt's status — so this is an RPC. See the function's own comment in
  // supabase/supplemental/05-logistic-supplements.sql for why it is SECURITY INVOKER and
  // why its statement order matters.
  receiveLine: async ({ locals, params, request }) => {
    const receiptId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('line_id'));
    const receivedQuantity = Number(form.get('received_quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return fail(422, { error: 'Received quantity must be zero or a positive whole number.' });
    }

    // Scoped to this receipt as well as the line: RLS permits an admin to receive any
    // line, so narrowing a crafted post to the receipt on screen is this route's job.
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
      p_received_quantity: receivedQuantity,
      p_user_account_id: locals.userAccountId,
    });

    if (rpcError) {
      // 42501 is insufficient_privilege, which the function raises when RLS refused the
      // line update — a receipt already complete or cancelled. That is an answer to the
      // operator, not a fault.
      if (rpcError.code === '42501') {
        return fail(409, { error: 'This receipt is no longer open for receiving.' });
      }
      return fail(500, { error: 'Failed to record the received quantity.' });
    }

    return { success: true as const };
  },
};
