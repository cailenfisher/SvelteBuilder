import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { createCycleCount, listCycleCount } from '$lib/server/logistic/cycle-count';
import { listStorageLocationOption } from '$lib/server/logistic/storage-location';
import { CYCLE_COUNT_STATUSES } from '@sveltebuilder/logistic';
import type { CycleCountListView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';
import { listCurrentUserAction } from '$lib/server/permission';
import { requireScope } from '../../require-access';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ parent, locals, url }): Promise<CycleCountListView> => {
  await requireScope(parent, 'cycle_count');
  const { data: actions, error: actionError } = await listCurrentUserAction(locals.supabase, 'cycle_count');
  if (actionError) throw error(500, 'Failed to load your permissions.');

  const statusParam = url.searchParams.get('status');
  const status = CYCLE_COUNT_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [countsResult, locationsResult, copy] = await Promise.all([
    listCycleCount(locals.supabase, { status }, { offset: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    // Stock lives at bin level, so counts are scoped to bins.
    listStorageLocationOption(locals.supabase, 'bin'),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (countsResult.error) throw error(500, 'Failed to load cycle counts.');
  if (locationsResult.error) throw error(500, 'Failed to load storage locations.');

  return {
    actions,
    cycleCounts: countsResult.data.rows,
    total: countsResult.data.total,
    page,
    perPage: PER_PAGE,
    status,
    statuses: CYCLE_COUNT_STATUSES,
    storageLocations: locationsResult.data,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const locationIds = form
      .getAll('storage_location_ids')
      .map((value) => Number(value))
      .filter((id) => Number.isInteger(id));

    if (locationIds.length === 0) {
      return formError(422, 'logistic.error.cycle_count_location_required');
    }

    const { data: cycleCountId, error: rpcError } = await createCycleCount(locals.supabase, {
      storageLocationIds: locationIds,
    });

    if (rpcError || cycleCountId === null) {
      // The function refuses locations that hold no stock, which is an answer to the
      // operator rather than a fault: there would be nothing to count.
      return formError(422, 'logistic.error.cycle_count_open_failed');
    }

    redirect(303, `/admin/logistic/cycle-count/${cycleCountId}`);
  },
};
