import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCycleCount, approveCycleCount } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const count = await locals.db.withUser((tx) => getCycleCount(tx, id, locals.locale.code));
  if (!count) throw error(404, 'Cycle count not found');

  return { count, locale: locals.locale };
};

export const actions: Actions = {
  approve: async ({ locals, params }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    await locals.db.withUser((tx) => approveCycleCount(tx, id, userAccountId));
    throw redirect(303, '/admin/logistic/cycle-count');
  },
};
