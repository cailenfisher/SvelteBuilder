import { error, fail } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { AdjustmentReason, StockAdjustment } from '@sveltebuilder/logistic';
import type { StockListView, StockLevelRow } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

// Reasons a human may choose. The operational ones — inbound_receipt, pick,
// return_restock, cycle_count_variance — are written by the workflows that cause them,
// so offering them here would let an operator record a movement that never happened.
const MANUAL_REASONS: AdjustmentReason[] = [
  'damage',
  'theft',
  'receiving_error',
  'system_correction',
  'other',
];

export const load: PageServerLoad = async ({ locals, url }): Promise<StockListView> => {
  const historyParam = url.searchParams.get('history');
  const historyId =
    historyParam !== null && /^\d+$/.test(historyParam) ? Number(historyParam) : null;
  const lowOnly = url.searchParams.get('filter') === 'low';

  const [levelsResult, historyResult, copy] = await Promise.all([
    locals.supabase
      .from('stock_level')
      // One string literal, not a concatenation: supabase-js derives the row type from
      // the literal, so splitting it across a `+` degrades every column to
      // GenericStringError and the loader stops typechecking against the view.
      .select(
        'id, storage_location_id, sku, on_hand, reserved, reorder_point, created_at, updated_at, storage_location!inner(id, slug, location_type)'
      )
      .order('sku'),
    historyId !== null
      ? locals.supabase
          .from('stock_adjustment')
          .select(
            'id, stock_level_id, user_account_id, delta, on_hand_before, on_hand_after, reason, note, created_at'
          )
          .eq('stock_level_id', historyId)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'storage_location'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (levelsResult.error) throw error(500, 'Failed to load stock levels.');
  if (historyResult.error) throw error(500, 'Failed to load the adjustment history.');

  const toOne = <T>(embed: T | T[] | null): T | null =>
    embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

  const levels: StockLevelRow[] = [];
  for (const row of levelsResult.data ?? []) {
    // storage_location is a to-one embed, which supabase-js types as an array because it
    // cannot know the relation's cardinality without generated types. The join is
    // !inner, so a null here is impossible rather than merely unhandled.
    const location = toOne(row.storage_location);
    if (location === null) continue;

    const available = row.on_hand - row.reserved;

    // Filtering in JS rather than in the query: the predicate compares two columns
    // against a third (on_hand - reserved <= reorder_point), which PostgREST cannot
    // express without a view or a computed column. The table is one row per SKU per
    // bin, so the set is small enough that this is the cheaper trade — revisit with a
    // generated column if a warehouse ever makes it not so.
    if (lowOnly && !(row.reorder_point !== null && available <= row.reorder_point)) continue;

    levels.push({
      id: row.id,
      storageLocationId: row.storage_location_id,
      sku: row.sku,
      onHand: row.on_hand,
      reserved: row.reserved,
      reorderPoint: row.reorder_point,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      available,
      storageLocation: {
        id: location.id,
        slug: location.slug,
        locationType: location.location_type,
      },
    });
  }

  const history: StockAdjustment[] = (historyResult.data ?? []).map((row) => ({
    id: row.id,
    stockLevelId: row.stock_level_id,
    userAccountId: row.user_account_id,
    delta: row.delta,
    onHandBefore: row.on_hand_before,
    onHandAfter: row.on_hand_after,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at,
  }));

  return {
    levels,
    history,
    historyId,
    lowOnly,
    manualReasons: MANUAL_REASONS,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // Two statements — move on_hand, append the audit row — and a partial result would be
  // stock that moved with no record of why. logistic_adjust_stock does both in one
  // transaction. It is SECURITY DEFINER, unlike the supplier create RPC, because
  // warehouse staff who are not admins legitimately move stock.
  adjust: async ({ locals, request }) => {
    const form = await request.formData();
    const stockLevelId = Number(form.get('stock_level_id'));
    const delta = Number(form.get('delta'));
    const reason = form.get('reason') as AdjustmentReason | null;
    const note = (form.get('note') as string | null)?.trim() || null;

    if (!Number.isInteger(stockLevelId)) return fail(422, { error: 'Invalid stock level.' });
    if (!Number.isInteger(delta) || delta === 0) {
      return fail(422, { error: 'Enter a non-zero whole number to adjust by.' });
    }
    // Checked against the same list the screen offers, because a form post is not
    // bound by what the select rendered.
    if (reason === null || !MANUAL_REASONS.includes(reason)) {
      return fail(422, { error: 'Choose a reason for the adjustment.' });
    }
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const { error: rpcError } = await locals.supabase.rpc('logistic_adjust_stock', {
      p_stock_level_id: stockLevelId,
      p_delta: delta,
      p_reason: reason,
      p_user_account_id: locals.userAccountId,
      p_note: note,
    });

    if (rpcError) {
      // The table's own check constraint refuses a negative on_hand, which is a real
      // answer to the operator rather than a fault: they tried to remove more than is
      // there. 23514 is check_violation.
      if (rpcError.code === '23514') {
        return fail(409, { error: 'That would take stock below zero.' });
      }
      return fail(500, { error: 'Failed to adjust the stock level.' });
    }

    return { success: true as const };
  },

  // One statement, so a plain call. The reorder point is an alerting threshold, not a
  // stock movement, and writes no audit row.
  setReorderPoint: async ({ locals, request }) => {
    const form = await request.formData();
    const stockLevelId = Number(form.get('stock_level_id'));
    const raw = ((form.get('reorder_point') as string | null) ?? '').trim();
    const reorderPoint = raw === '' ? null : Number(raw);

    if (!Number.isInteger(stockLevelId)) return fail(422, { error: 'Invalid stock level.' });
    if (reorderPoint !== null && (!Number.isInteger(reorderPoint) || reorderPoint < 0)) {
      return fail(422, { error: 'The reorder point must be zero or a positive whole number.' });
    }

    const { error: updateError } = await locals.supabase
      .from('stock_level')
      .update({ reorder_point: reorderPoint })
      .eq('id', stockLevelId);

    if (updateError) return fail(500, { error: 'Failed to save the reorder point.' });

    return { success: true as const };
  },
};
