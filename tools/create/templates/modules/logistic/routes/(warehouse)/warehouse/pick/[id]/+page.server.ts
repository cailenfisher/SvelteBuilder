import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getPickTask,
  recordPickedQuantity,
  completePickTask,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const userAccountId = locals.userAccountId;
  if (userAccountId === null) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (isNaN(id)) throw error(400, 'Invalid task ID');

  const task = await locals.db.withUser((tx) => getPickTask(tx, id, locals.locale.code));
  if (!task) throw error(404, 'Task not found');
  if (task.userAccountId !== Number(userAccountId)) throw error(403, 'Not your task');
  if (task.status === 'completed') throw redirect(303, '/warehouse/pick');
  if (task.status === 'cancelled') throw error(410, 'Task has been cancelled');

  return { task, locale: locals.locale };
};

export const actions: Actions = {
  pick: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const formData = await request.formData();
    const lineId = Number(formData.get('line_id'));
    const quantity = Number(formData.get('quantity'));

    if (isNaN(lineId) || isNaN(quantity) || quantity < 0)
      throw error(400, 'Invalid input');

    await locals.db.withUser((tx) =>
      recordPickedQuantity(tx, lineId, quantity, userAccountId),
    );
    return { success: true };
  },

  complete: async ({ locals, params }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    await locals.db.withUser((tx) => completePickTask(tx, id, userAccountId));
    throw redirect(303, '/warehouse/pick');
  },
};
