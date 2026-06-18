import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getReturnAuthorization,
  getStorageLocations,
  gradeReturnLine,
  processReturnAuthorization,
} from '@sveltebuilder/logistic/server';
import type { ReturnCondition, ReturnDisposition } from '@sveltebuilder/logistic';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const [returnAuth, locations] = await Promise.all([
    getReturnAuthorization(locals.supabase, id),
    getStorageLocations(locals.supabase, { active: true }),
  ]);

  if (!returnAuth) throw error(404, 'Return authorization not found');

  return { returnAuth, locations, locale: locals.locale };
};

export const actions: Actions = {
  gradeLine: async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const lineId = Number(data.get('line_id'));
    const receivedQuantity = Number(data.get('received_quantity'));
    const condition = data.get('condition') as ReturnCondition;
    const disposition = data.get('disposition') as ReturnDisposition;
    const storageLocationId = data.get('storage_location_id')
      ? Number(data.get('storage_location_id'))
      : undefined;

    await gradeReturnLine(locals.supabase, lineId, {
      receivedQuantity,
      condition,
      disposition,
      storageLocationId,
      userAccountId: session.user.id,
    });

    return { success: true };
  },

  process: async ({ locals, params }) => {
    const id = Number(params.id);
    await processReturnAuthorization(locals.supabase, id);
    throw redirect(303, '/admin/logistic/return');
  },
};
