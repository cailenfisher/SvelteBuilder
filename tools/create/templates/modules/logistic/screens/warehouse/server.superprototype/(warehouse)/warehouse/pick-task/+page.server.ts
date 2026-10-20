import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  listAssignedPickTask,
  listOpenPickTask,
  takePickTask,
} from '$lib/server/logistic/pick-task';
import type { PickTaskWarehouseQueueView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';

export const load: PageServerLoad = async ({ locals }): Promise<PickTaskWarehouseQueueView> => {
  // The layout's load has already redirected an anonymous visitor, so this is not null by
  // the time the page loads. Narrowing rather than asserting keeps that checkable.
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const [mineResult, openResult, copy] = await Promise.all([
    listAssignedPickTask(locals.supabase, locals.userAccountId, 5),
    listOpenPickTask(locals.supabase, 20),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (mineResult.error) throw error(500, 'Failed to load your tasks.');
  if (openResult.error) throw error(500, 'Failed to load the open queue.');

  return {
    myPickTasks: mineResult.data,
    openPickTasks: openResult.data.rows,
    openPickTaskTotal: openResult.data.total,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  take: async ({ locals, request }) => {
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const taskId = Number(form.get('pick_task_id'));
    if (!Number.isInteger(taskId)) return formError(422, 'logistic.error.pick_task_invalid');

    const { data: taken, error: updateError } = await takePickTask(locals.supabase, taskId);

    if (updateError) return formError(500, 'logistic.error.pick_task_take_failed');
    if (!taken) return formError(409, 'logistic.error.pick_task_taken');

    redirect(303, `/warehouse/pick-task/${taskId}`);
  },
};
