import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { CycleCountStatus } from '@sveltebuilder/logistic';
import type {
  CycleCountListView,
  CycleCountRow,
  LocationOption,
} from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

const COUNT_STATUSES: CycleCountStatus[] = ['open', 'in_progress', 'complete', 'cancelled'];

export const load: PageServerLoad = async ({ locals, url }): Promise<CycleCountListView> => {
  const statusParam = url.searchParams.get('status');
  const status = COUNT_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const from = (page - 1) * PER_PAGE;

  let query = locals.supabase
    .from('cycle_count')
    .select(
      'id, user_account_id, status, created_at, updated_at, cycle_count_line(id, counted_quantity)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1);

  if (status !== null) query = query.eq('status', status);

  const [countsResult, locationsResult, copy] = await Promise.all([
    query,
    // Stock lives at bin level, so counts are scoped to bins.
    locals.supabase
      .from('storage_location')
      .select('id, slug, location_type')
      .eq('active', true)
      .eq('location_type', 'bin')
      .order('sort_order'),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (countsResult.error) throw error(500, 'Failed to load cycle counts.');
  if (locationsResult.error) throw error(500, 'Failed to load storage locations.');

  const counts: CycleCountRow[] = (countsResult.data ?? []).map((row) => {
    // The lines are embedded rather than aggregated because the list shows progress —
    // counted of total — and PostgREST cannot express "count where counted_quantity is not
    // null" alongside a plain count in one aggregate embed. Only the two columns needed for
    // the tally are selected, so the embed stays small.
    const lines = row.cycle_count_line ?? [];
    return {
      id: row.id,
      userAccountId: row.user_account_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lineCount: lines.length,
      countedCount: lines.filter((line) => line.counted_quantity !== null).length,
    };
  });

  const locations: LocationOption[] = (locationsResult.data ?? []).map((location) => ({
    id: location.id,
    slug: location.slug,
    locationType: location.location_type,
  }));

  return {
    counts,
    total: countsResult.count ?? counts.length,
    page,
    perPage: PER_PAGE,
    status,
    statuses: COUNT_STATUSES,
    locations,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // Opening a count snapshots what the system believes is in each chosen bin, so it is the
  // count row plus one line per stock level — an RPC, and one whose snapshot semantics are
  // the reason it cannot be two calls. See the function's comment for that.
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const locationIds = form
      .getAll('location_ids')
      .map((value) => Number(value))
      .filter((id) => Number.isInteger(id));

    if (locationIds.length === 0) {
      return fail(422, { error: 'Choose at least one location to count.' });
    }

    const { data, error: rpcError } = await locals.supabase.rpc('logistic_create_cycle_count', {
      p_user_account_id: locals.userAccountId,
      p_storage_location_ids: locationIds,
    });

    if (rpcError || data === null) {
      // The function refuses locations that hold no stock, which is an answer to the
      // operator rather than a fault: there would be nothing to count.
      return fail(422, {
        error: 'Could not open a count. The chosen locations may hold no stock.',
      });
    }

    redirect(303, `/admin/logistic/cycle-count/${data}`);
  },
};
