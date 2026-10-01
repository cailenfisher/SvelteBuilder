import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { ReturnCondition, ReturnDisposition } from '@sveltebuilder/logistic';
import type { LocationOption, ReturnDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

const CONDITIONS: ReturnCondition[] = ['salable', 'damaged', 'defective', 'wrong_item'];
const DISPOSITIONS: ReturnDisposition[] = ['restock', 'quarantine', 'scrap', 'refurbish'];

export const load: PageServerLoad = async ({ locals, params }): Promise<ReturnDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [returnResult, locationsResult, copy] = await Promise.all([
    locals.supabase
      .from('return_authorization')
      .select(
        'id, shipment_id, user_account_id, status, reason, note, created_at, updated_at, return_authorization_line(id, return_authorization_id, shipment_line_id, sku, expected_quantity, received_quantity, condition, disposition, created_at)'
      )
      .eq('id', id)
      .maybeSingle(),
    // Only bins hold stock, and restocking is the only thing this screen needs a location
    // for, so the coarser levels of the tree are not shipped.
    locals.supabase
      .from('storage_location')
      .select('id, slug, location_type')
      .eq('active', true)
      .eq('location_type', 'bin')
      .order('sort_order'),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (returnResult.error) throw error(500, 'Failed to load the return.');
  if (!returnResult.data) throw error(404, 'Return authorization not found.');
  if (locationsResult.error) throw error(500, 'Failed to load storage locations.');

  const row = returnResult.data;

  const locations: LocationOption[] = (locationsResult.data ?? []).map((location) => ({
    id: location.id,
    slug: location.slug,
    locationType: location.location_type,
  }));

  return {
    returnAuthorization: {
      id: row.id,
      shipmentId: row.shipment_id,
      userAccountId: row.user_account_id,
      status: row.status,
      reason: row.reason,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines: (row.return_authorization_line ?? [])
        .map((line) => ({
          id: line.id,
          returnAuthorizationId: line.return_authorization_id,
          shipmentLineId: line.shipment_line_id,
          sku: line.sku,
          expectedQuantity: line.expected_quantity,
          receivedQuantity: line.received_quantity,
          condition: line.condition,
          disposition: line.disposition,
          createdAt: line.created_at,
        }))
        .sort((a, b) => a.id - b.id),
    },
    locations,
    conditions: CONDITIONS,
    dispositions: DISPOSITIONS,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // Update the line and, for a restock, put the goods away — two or four statements, so an
  // RPC. See the function in supabase/supplemental/05-logistic-supplements.sql for why it
  // is SECURITY INVOKER and why the line update goes first.
  gradeLine: async ({ locals, params, request }) => {
    const returnId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('line_id'));
    const receivedQuantity = Number(form.get('received_quantity'));
    const condition = form.get('condition') as ReturnCondition | null;
    const disposition = form.get('disposition') as ReturnDisposition | null;
    const locationRaw = (form.get('storage_location_id') as string | null)?.trim();

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return fail(422, { error: 'Received quantity must be zero or a positive whole number.' });
    }
    if (condition === null || !CONDITIONS.includes(condition)) {
      return fail(422, { error: 'Choose the condition the goods arrived in.' });
    }
    if (disposition === null || !DISPOSITIONS.includes(disposition)) {
      return fail(422, { error: 'Choose what happens to the goods.' });
    }

    const storageLocationId = locationRaw ? Number(locationRaw) : null;
    // Checked here as well as in the function, so the operator gets a message about the
    // form rather than a 500 from a raised exception.
    if (disposition === 'restock' && !Number.isInteger(storageLocationId)) {
      return fail(422, { error: 'Restocking needs a location to put the goods in.' });
    }

    // Scoped to this return as well as the line: RLS permits an admin to grade any line,
    // so narrowing a crafted post to the return on screen is this route's job.
    const { data: line, error: lineError } = await locals.supabase
      .from('return_authorization_line')
      .select('id')
      .eq('id', lineId)
      .eq('return_authorization_id', returnId)
      .maybeSingle();

    if (lineError) return fail(500, { error: 'Failed to load the line.' });
    if (line === null) return fail(404, { error: 'That line is not on this return.' });

    const { error: rpcError } = await locals.supabase.rpc('logistic_grade_return_line', {
      p_line_id: lineId,
      p_received_quantity: receivedQuantity,
      p_condition: condition,
      p_disposition: disposition,
      p_user_account_id: locals.userAccountId,
      p_storage_location_id: storageLocationId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(409, { error: 'This return is no longer open for grading.' });
      }
      return fail(500, { error: 'Failed to record the grading.' });
    }

    return { success: true as const };
  },

  // One statement. Marking a return processed is a bookkeeping transition: every line's
  // disposition has already moved whatever stock it was going to move.
  process: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const { error: updateError } = await locals.supabase
      .from('return_authorization')
      .update({ status: 'processed' })
      .eq('id', id);

    if (updateError) return fail(500, { error: 'Failed to mark the return processed.' });

    redirect(303, '/admin/logistic/return');
  },
};
