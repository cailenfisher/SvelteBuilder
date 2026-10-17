import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  listAssignedCycleCount,
  listOpenCycleCount,
  takeCycleCount,
} from '$lib/server/logistic/cycle-count';
import type { CycleCountWarehouseQueueView } from '@sveltebuilder/logistic/views';
import type { PageServerLoad, Actions } from './$types';
import { formError } from '$lib/server/form-error';

export const load: PageServerLoad = async ({ locals }): Promise<CycleCountWarehouseQueueView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const [mineResult, openResult, copy] = await Promise.all([
    listAssignedCycleCount(locals.supabase, locals.userAccountId, 5),
    listOpenCycleCount(locals.supabase, 20),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (mineResult.error) throw error(500, 'Failed to load your counts.');
  if (openResult.error) throw error(500, 'Failed to load the open queue.');

  return {
    myCycleCounts: mineResult.data,
    openCycleCounts: openResult.data,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  take: async ({ locals, request }) => {
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const countId = Number(form.get('cycle_count_id'));
    if (!Number.isInteger(countId)) return formError(422, 'logistic.error.cycle_count_invalid');

    const { data: taken, error: updateError } = await takeCycleCount(
      locals.supabase,
      countId,
      locals.userAccountId
    );

    if (updateError) return formError(500, 'logistic.error.cycle_count_take_failed');
    if (!taken) return formError(409, 'logistic.error.cycle_count_taken');

    redirect(303, `/warehouse/cycle-count/${countId}`);
  },
};
