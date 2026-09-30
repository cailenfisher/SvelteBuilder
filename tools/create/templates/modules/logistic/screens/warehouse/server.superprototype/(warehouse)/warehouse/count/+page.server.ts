import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { CountQueueView, CycleCountRow } from '@sveltebuilder/logistic/views';
import type { PageServerLoad, Actions } from './$types';

const COUNT_COLUMNS =
  'id, user_account_id, status, created_at, updated_at, cycle_count_line(id, counted_quantity)';

export const load: PageServerLoad = async ({ locals }): Promise<CountQueueView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');
  const userAccountId = locals.userAccountId;

  const [mineResult, openResult, copy] = await Promise.all([
    locals.supabase
      .from('cycle_count')
      .select(COUNT_COLUMNS)
      .eq('status', 'in_progress')
      .eq('user_account_id', userAccountId)
      .order('created_at')
      .limit(5),
    locals.supabase
      .from('cycle_count')
      .select(COUNT_COLUMNS)
      .eq('status', 'open')
      .order('created_at')
      .limit(20),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (mineResult.error) throw error(500, 'Failed to load your counts.');
  if (openResult.error) throw error(500, 'Failed to load the open queue.');

  type Row = NonNullable<typeof openResult.data>[number];

  const toCount = (row: Row): CycleCountRow => {
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
  };

  return {
    myCounts: (mineResult.data ?? []).map(toCount),
    openCounts: (openResult.data ?? []).map(toCount),
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // One conditional update, as with taking a pick task: the `status = open` predicate is
  // what makes it safe when two counters claim the same count at once.
  take: async ({ locals, request }) => {
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const countId = Number(form.get('count_id'));
    if (!Number.isInteger(countId)) return fail(422, { error: 'Invalid count.' });

    const { data, error: updateError } = await locals.supabase
      .from('cycle_count')
      .update({ status: 'in_progress', user_account_id: locals.userAccountId })
      .eq('id', countId)
      .eq('status', 'open')
      .select('id');

    if (updateError) return fail(500, { error: 'Failed to take the count.' });
    if ((data ?? []).length === 0) {
      return fail(409, { error: 'Someone else has already taken that count.' });
    }

    redirect(303, `/warehouse/count/${countId}`);
  },
};
