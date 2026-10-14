import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  getReturnAuthorizationLine,
  gradeReturnAuthorizationLine,
} from '$lib/server/logistic/return-authorization-line';
import {
  getReturnAuthorization,
  processReturnAuthorization,
} from '$lib/server/logistic/return-authorization';
import { listStorageLocationOption } from '$lib/server/logistic/storage-location';
import { RETURN_CONDITIONS, RETURN_DISPOSITIONS } from '@sveltebuilder/logistic';
import type { ReturnCondition, ReturnDisposition } from '@sveltebuilder/logistic';
import type { ReturnAuthorizationDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
  params,
}): Promise<ReturnAuthorizationDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [returnResult, locationsResult, copy] = await Promise.all([
    getReturnAuthorization(locals.supabase, id),
    // Only bins hold stock, and restocking is the only thing this screen needs a location
    // for, so the coarser levels of the tree are not shipped.
    listStorageLocationOption(locals.supabase, 'bin'),
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

  return {
    returnAuthorization: returnResult.data,
    storageLocations: locationsResult.data,
    conditions: RETURN_CONDITIONS,
    dispositions: RETURN_DISPOSITIONS,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  gradeReturnAuthorizationLine: async ({ locals, params, request }) => {
    const returnId = Number(params.id);
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const lineId = Number(form.get('return_authorization_line_id'));
    const receivedQuantity = Number(form.get('received_quantity'));
    const condition = form.get('condition') as ReturnCondition | null;
    const disposition = form.get('disposition') as ReturnDisposition | null;
    const locationRaw = (form.get('storage_location_id') as string | null)?.trim();

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return fail(422, { error: 'Received quantity must be zero or a positive whole number.' });
    }
    if (condition === null || !RETURN_CONDITIONS.includes(condition)) {
      return fail(422, { error: 'Choose the condition the goods arrived in.' });
    }
    if (disposition === null || !RETURN_DISPOSITIONS.includes(disposition)) {
      return fail(422, { error: 'Choose what happens to the goods.' });
    }

    const storageLocationId = locationRaw ? Number(locationRaw) : null;
    // Checked here as well as in the function, so the operator gets a message about the
    // form rather than a 500 from a raised exception.
    if (disposition === 'restock' && !Number.isInteger(storageLocationId)) {
      return fail(422, { error: 'Restocking needs a location to put the goods in.' });
    }

    const { data: line, error: lineError } = await getReturnAuthorizationLine(
      locals.supabase,
      returnId,
      lineId
    );

    if (lineError) return fail(500, { error: 'Failed to load the line.' });
    if (line === null) return fail(404, { error: 'That line is not on this return.' });

    const { error: rpcError } = await gradeReturnAuthorizationLine(locals.supabase, {
      id: lineId,
      receivedQuantity,
      condition,
      disposition,
      userAccountId: locals.userAccountId,
      storageLocationId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(409, { error: 'This return is no longer open for grading.' });
      }
      return fail(500, { error: 'Failed to record the grading.' });
    }

    return { success: true as const };
  },

  process: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const { error: updateError } = await processReturnAuthorization(locals.supabase, id);

    if (updateError) return fail(500, { error: 'Failed to mark the return processed.' });

    redirect(303, '/admin/logistic/return-authorization');
  },
};
