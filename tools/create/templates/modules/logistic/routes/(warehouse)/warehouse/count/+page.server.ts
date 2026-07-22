import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCycleCounts, assignCycleCount } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  const userAccountId = locals.userAccountId;
  if (userAccountId === null) throw redirect(303, '/sign-in');

  const { myCounts, openCounts } = await locals.db.withUser(async (tx) => {
    const [mine, open] = await Promise.all([
      getCycleCounts(tx, { status: 'in_progress', userAccountId, perPage: 5 }),
      getCycleCounts(tx, { status: 'open', perPage: 20 }),
    ]);
    return { myCounts: mine.counts, openCounts: open.counts };
  });

  return { myCounts, openCounts, locale: locals.locale };
};

export const actions: Actions = {
  take: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const countId = Number(data.get('count_id'));

    await locals.db.withUser((tx) => assignCycleCount(tx, countId, userAccountId));
    throw redirect(303, `/warehouse/count/${countId}`);
  },
};
