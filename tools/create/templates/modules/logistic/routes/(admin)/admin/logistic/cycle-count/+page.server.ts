import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getCycleCounts,
  getStorageLocations,
  createCycleCount,
} from '@sveltebuilder/logistic/server';
import type { CycleCountStatus } from '@sveltebuilder/logistic';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const status = (url.searchParams.get('status') ?? undefined) as CycleCountStatus | undefined;
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = 20;

  const { counts, total, locations } = await locals.db.withUser(async (tx) => {
    const [countsResult, locations] = await Promise.all([
      getCycleCounts(tx, { status, page, perPage }),
      // Stock lives at bin level; counts are scoped to bins.
      getStorageLocations(tx, { type: 'bin', active: true }),
    ]);
    return { ...countsResult, locations };
  });

  return { counts, total, status, page, perPage, locations, locale: locals.locale };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const locationIds = data
      .getAll('location_ids')
      .map((value) => Number(value))
      .filter((id) => !isNaN(id));

    if (locationIds.length === 0) throw error(400, 'Select at least one location');

    const id = await locals.db.withUser((tx) =>
      createCycleCount(tx, locationIds, userAccountId),
    );

    throw redirect(303, `/admin/logistic/cycle-count/${id}`);
  },
};
