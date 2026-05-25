import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getPickTasks, assignPickTask } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const [myTasksResult, openTasksResult] = await Promise.all([
    getPickTasks(locals.supabase, {
      status: 'in_progress',
      userAccountId: session.user.id,
      perPage: 5,
    }),
    getPickTasks(locals.supabase, { status: 'open', perPage: 20 }),
  ]);

  return {
    myTasks: myTasksResult.tasks,
    openTasks: openTasksResult.tasks,
    openTotal: openTasksResult.total,
    locale: locals.locale,
  };
};

export const actions: Actions = {
  take: async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const taskId = Number(data.get('task_id'));

    await assignPickTask(locals.supabase, taskId, session.user.id);
    throw redirect(303, `/warehouse/pick/${taskId}`);
  },
};
