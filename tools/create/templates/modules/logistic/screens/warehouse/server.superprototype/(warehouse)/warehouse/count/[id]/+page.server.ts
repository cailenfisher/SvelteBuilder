import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { CountDetailView, CycleCountLineRow } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }): Promise<CountDetailView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');
  const userAccountId = locals.userAccountId;

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [countResult, copy] = await Promise.all([
    locals.supabase
      .from('cycle_count')
      .select(
        'id, user_account_id, status, created_at, updated_at, cycle_count_line(id, cycle_count_id, stock_level_id, storage_location_id, sku, expected_quantity, counted_quantity, variance, created_at, storage_location!inner(id, slug, location_type))'
      )
      .eq('id', id)
      .maybeSingle(),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (countResult.error) throw error(500, 'Failed to load the count.');
  if (!countResult.data) throw error(404, 'Cycle count not found.');

  const row = countResult.data;
  if (row.user_account_id !== userAccountId) throw error(403, 'That count is not yours.');
  if (row.status === 'complete') redirect(303, '/warehouse/count');
  if (row.status === 'cancelled') throw error(410, 'That count has been cancelled.');

  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

  const lines: CycleCountLineRow[] = [];
  for (const line of row.cycle_count_line ?? []) {
    const location = toOne(line.storage_location);
    if (location === null) continue;
    lines.push({
      id: line.id,
      cycleCountId: line.cycle_count_id,
      stockLevelId: line.stock_level_id,
      storageLocationId: line.storage_location_id,
      sku: line.sku,
      expectedQuantity: line.expected_quantity,
      countedQuantity: line.counted_quantity,
      variance: line.variance,
      createdAt: line.created_at,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }
  lines.sort((a, b) => a.storageLocationId - b.storageLocationId || a.sku.localeCompare(b.sku));

  return {
    cycleCount: {
      id: row.id,
      userAccountId: row.user_account_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lines,
    },
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // One statement, so a plain call. Recording a count moves no stock — the variance is
  // applied later, all at once, when an admin approves the count. That separation is
  // deliberate: a counter records what they see, and correcting the books is a decision.
  record: async ({ locals, params, request }) => {
    const countId = Number(params.id);

    const form = await request.formData();
    const lineId = Number(form.get('line_id'));
    const quantity = Number(form.get('quantity'));

    if (!Number.isInteger(lineId)) return fail(422, { error: 'Invalid line.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return fail(422, { error: 'Enter zero or a positive whole number.' });
    }

    // Scoped to this count as well as the line. The worker policy on cycle_count_line
    // already restricts updates to counts assigned to the caller; this stops a crafted
    // post reaching another line of a count that is theirs.
    const { data, error: updateError } = await locals.supabase
      .from('cycle_count_line')
      .update({ counted_quantity: quantity })
      .eq('id', lineId)
      .eq('cycle_count_id', countId)
      .select('id');

    if (updateError) return fail(500, { error: 'Failed to record the count.' });
    if ((data ?? []).length === 0) {
      // No row updated means RLS refused it — the count is not this worker's.
      return fail(403, { error: 'That count is not yours.' });
    }

    return { success: true as const };
  },
};
