import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  listAssignedCycleCount,
  listOpenCycleCount,
  takeCycleCount,
} from '$lib/server/logistic/cycle-count';
import type { CycleCountWarehouseQueueView } from '@sveltebuilder/logistic/views';
import type { PageServerLoad, Actions } from './$types';

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
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const countId = Number(form.get('cycle_count_id'));
    if (!Number.isInteger(countId)) return fail(422, { error: 'Invalid count.' });

    const { data: taken, error: updateError } = await takeCycleCount(
      locals.supabase,
      countId,
      locals.userAccountId
    );

    if (updateError) return fail(500, { error: 'Failed to take the count.' });
    if (!taken) return fail(409, { error: 'Someone else has already taken that count.' });

    redirect(303, `/warehouse/cycle-count/${countId}`);
  },
};
