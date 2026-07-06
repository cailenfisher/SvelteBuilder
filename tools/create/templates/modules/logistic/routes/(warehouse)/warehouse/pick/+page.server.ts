import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getPickTasks, assignPickTask } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  const userAccountId = locals.userAccountId;
  if (userAccountId === null) throw redirect(303, '/sign-in');

  const { myTasks, openTasks, openTotal } = await locals.db.withUser(async (tx) => {
    const [mine, open] = await Promise.all([
      getPickTasks(tx, { status: 'in_progress', userAccountId, perPage: 5 }),
      getPickTasks(tx, { status: 'open', perPage: 20 }),
    ]);
    return { myTasks: mine.tasks, openTasks: open.tasks, openTotal: open.total };
  });

  return { myTasks, openTasks, openTotal, locale: locals.locale };
};

export const actions: Actions = {
  take: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const taskId = Number(data.get('task_id'));

    await locals.db.withUser((tx) => assignPickTask(tx, taskId, userAccountId));
    throw redirect(303, `/warehouse/pick/${taskId}`);
  },
};
