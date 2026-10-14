import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { recordCycleCountLineQuantity } from '$lib/server/logistic/cycle-count-line';
import { getCycleCount } from '$lib/server/logistic/cycle-count';
import type { CycleCountWarehouseDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
  params,
}): Promise<CycleCountWarehouseDetailView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [countResult, copy] = await Promise.all([
    getCycleCount(locals.supabase, id),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (countResult.error) throw error(500, 'Failed to load the count.');
  if (!countResult.data) throw error(404, 'Cycle count not found.');

  const cycleCount = countResult.data;
  if (cycleCount.userAccountId !== locals.userAccountId)
    throw error(403, 'That count is not yours.');
  if (cycleCount.status === 'completed') redirect(303, '/warehouse/cycle-count');
  if (cycleCount.status === 'cancelled') throw error(410, 'That count has been cancelled.');

  return {
    cycleCount,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  record: async ({ locals, params, request }) => {
    const countId = Number(params.id);

    const form = await request.formData();
    const lineId = Number(form.get('cycle_count_line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail(422, { error: 'Enter zero or a positive whole number.' });
    }

    const { data: recorded, error: updateError } = await recordCycleCountLineQuantity(
      locals.supabase,
      countId,
      { id: lineId, countedQuantity: quantity }
    );

    if (updateError) return fail(500, { error: 'Failed to record the count.' });
    // No row updated means RLS refused it — the count is not this worker's.
    if (!recorded) return fail(403, { error: 'That count is not yours.' });

    return { success: true as const };
  },
};
