import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { approveCycleCount, getCycleCount } from '$lib/server/logistic/cycle-count';
import type { CycleCountDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';

export const load: PageServerLoad = async ({ locals, params }): Promise<CycleCountDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [countResult, copy] = await Promise.all([
    getCycleCount(locals.supabase, id),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (countResult.error) throw error(500, 'Failed to load the cycle count.');
  if (!countResult.data) throw error(404, 'Cycle count not found.');

  return {
    cycleCount: countResult.data,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  approve: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const { error: rpcError } = await approveCycleCount(locals.supabase, id, locals.userAccountId);

    if (rpcError) {
      if (rpcError.code === '42501') {
        return formError(409, 'logistic.error.cycle_count_not_approvable');
      }
      // A variance that would take stock below zero fails the table's check constraint,
      // which is a real answer: the counted figure cannot be right.
      if (rpcError.code === '23514') {
        return formError(409, 'logistic.error.cycle_count_negative_stock');
      }
      return formError(500, 'logistic.error.cycle_count_approve_failed');
    }

    redirect(303, '/admin/logistic/cycle-count');
  },
};
