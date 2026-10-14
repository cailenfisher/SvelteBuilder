import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  listAssignedPickTask,
  listOpenPickTask,
  takePickTask,
} from '$lib/server/logistic/pick-task';
import type { PickTaskWarehouseQueueView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

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
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const taskId = Number(form.get('pick_task_id'));
    if (!Number.isInteger(taskId)) return fail(422, { error: 'Invalid task.' });

    const { data: taken, error: updateError } = await takePickTask(
      locals.supabase,
      taskId,
      locals.userAccountId
    );

    if (updateError) return fail(500, { error: 'Failed to take the task.' });
    if (!taken) return fail(409, { error: 'Someone else has already taken that task.' });

    redirect(303, `/warehouse/pick-task/${taskId}`);
  },
};
