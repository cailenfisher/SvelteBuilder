import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getPickTask,
  recordPickedQuantity,
  completePickTask,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (isNaN(id)) throw error(400, 'Invalid task ID');

  const task = await getPickTask(locals.supabase, id, locals.locale.code);
  if (!task) throw error(404, 'Task not found');
  if (task.userAccountId !== session.user.id) throw error(403, 'Not your task');
  if (task.status === 'completed') throw redirect(303, '/warehouse/pick');
  if (task.status === 'cancelled') throw error(410, 'Task has been cancelled');

  return { task, locale: locals.locale };
};

export const actions: Actions = {
  pick: async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const formData = await request.formData();
    const lineId = Number(formData.get('line_id'));
    const quantity = Number(formData.get('quantity'));

    if (isNaN(lineId) || isNaN(quantity) || quantity < 0)
      throw error(400, 'Invalid input');

    await recordPickedQuantity(locals.supabase, lineId, quantity, session.user.id);
    return { success: true };
  },

  complete: async ({ locals, params }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    await completePickTask(locals.supabase, id, session.user.id);
    throw redirect(303, '/warehouse/pick');
  },
};
