import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCycleCount, recordCycleCountLine } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const userAccountId = locals.userAccountId;
  if (userAccountId === null) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (isNaN(id)) throw error(400, 'Invalid count ID');

  const count = await locals.db.withUser((tx) => getCycleCount(tx, id, locals.locale.code));
  if (!count) throw error(404, 'Cycle count not found');
  if (count.userAccountId !== Number(userAccountId)) throw error(403, 'Not your count');
  if (count.status === 'complete') throw redirect(303, '/warehouse/count');
  if (count.status === 'cancelled') throw error(410, 'Count has been cancelled');

  return { count, locale: locals.locale };
};

export const actions: Actions = {
  record: async ({ locals, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const formData = await request.formData();
    const lineId = Number(formData.get('line_id'));
    const quantity = Number(formData.get('quantity'));

    if (isNaN(lineId) || isNaN(quantity) || quantity < 0)
      throw error(400, 'Invalid input');

    await locals.db.withUser((tx) => recordCycleCountLine(tx, lineId, quantity));
    return { success: true };
  },
};
