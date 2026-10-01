import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { CycleCountDetailView, CycleCountLineRow } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }): Promise<CycleCountDetailView> => {
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

  if (countResult.error) throw error(500, 'Failed to load the cycle count.');
  if (!countResult.data) throw error(404, 'Cycle count not found.');

  const row = countResult.data;

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
  // Walk order: by location then SKU, so a counter moving through the aisle follows the
  // page rather than the page following insertion order.
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
  // Applies every variance the count found and closes it — one adjustment per differing
  // line plus the status update, so an RPC. A partly applied count is the worst outcome:
  // it reads as closed while the stock it was meant to correct is still wrong.
  approve: async ({ locals, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const { error: rpcError } = await locals.supabase.rpc('logistic_approve_cycle_count', {
      p_cycle_count_id: id,
      p_user_account_id: locals.userAccountId,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(409, { error: 'This count can no longer be approved.' });
      }
      // A variance that would take stock below zero fails the table's check constraint,
      // which is a real answer: the counted figure cannot be right.
      if (rpcError.code === '23514') {
        return fail(409, { error: 'Applying these counts would take stock below zero.' });
      }
      return fail(500, { error: 'Failed to approve the count.' });
    }

    redirect(303, '/admin/logistic/cycle-count');
  },
};
