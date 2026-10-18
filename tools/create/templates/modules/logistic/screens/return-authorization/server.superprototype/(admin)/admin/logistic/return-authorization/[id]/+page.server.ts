import { error, redirect } from '@sveltejs/kit';
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
import { formError } from '$lib/server/form-error';
import { listCurrentUserAction } from '$lib/server/permission';
import { requireScope } from '../../../require-access';

export const load: PageServerLoad = async ({
  parent,
  locals,
  params,
}): Promise<ReturnAuthorizationDetailView> => {
  await requireScope(parent, 'return_authorization');
  const { data: actions, error: actionError } = await listCurrentUserAction(locals.supabase, 'return_authorization');
  if (actionError) throw error(500, 'Failed to load your permissions.');

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
    actions,
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
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const lineId = Number(form.get('return_authorization_line_id'));
    const receivedQuantity = Number(form.get('received_quantity'));
    const condition = form.get('condition') as ReturnCondition | null;
    const disposition = form.get('disposition') as ReturnDisposition | null;
    const locationRaw = (form.get('storage_location_id') as string | null)?.trim();

    if (!Number.isInteger(lineId)) return formError(422, 'logistic.error.line_invalid');
    if (!Number.isInteger(receivedQuantity) || receivedQuantity < 0) {
      return formError(422, 'logistic.error.received_quantity_invalid');
    }
    if (condition === null || !RETURN_CONDITIONS.includes(condition)) {
      return formError(422, 'logistic.error.condition_required');
    }
    if (disposition === null || !RETURN_DISPOSITIONS.includes(disposition)) {
      return formError(422, 'logistic.error.disposition_required');
    }

    const storageLocationId = locationRaw ? Number(locationRaw) : null;
    // Checked here as well as in the function, so the operator gets a message about the
    // form rather than a 500 from a raised exception.
    if (disposition === 'restock' && !Number.isInteger(storageLocationId)) {
      return formError(422, 'logistic.error.restock_location_required');
    }

    const { data: line, error: lineError } = await getReturnAuthorizationLine(
      locals.supabase,
      returnId,
      lineId
    );

    if (lineError) return formError(500, 'logistic.error.line_load_failed');
    if (line === null) return formError(404, 'logistic.error.return_authorization_line_mismatch');

    const { error: rpcError } = await gradeReturnAuthorizationLine(locals.supabase, {
      id: lineId,
      receivedQuantity,
      condition,
      disposition,
      storageLocationId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return formError(409, 'logistic.error.return_authorization_closed');
      }
      return formError(500, 'logistic.error.grading_save_failed');
    }

    return { success: true as const };
  },

  process: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const { error: updateError } = await processReturnAuthorization(locals.supabase, id);

    if (updateError) return formError(500, 'logistic.error.return_authorization_process_failed');

    redirect(303, '/admin/logistic/return-authorization');
  },
};
