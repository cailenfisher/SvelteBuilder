import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getStockLevels,
  getStockAdjustments,
  adjustStock,
  setReorderPoint,
} from '@sveltebuilder/logistic/server';
import type { AdjustmentReason, StockAdjustment } from '@sveltebuilder/logistic';

// Reasons offered for manual adjustments. Operational reasons
// (inbound_receipt, pick, return_restock, cycle_count_variance) are written by
// their own workflows, never by hand.
const MANUAL_REASONS: AdjustmentReason[] = [
  'damage',
  'theft',
  'receiving_error',
  'system_correction',
  'other',
];

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');
  const { locale } = locals;

  const historyId = url.searchParams.get('history') ? Number(url.searchParams.get('history')) : null;
  const lowOnly = url.searchParams.get('filter') === 'low';

  const { levels, history } = await locals.db.withUser(async (tx) => {
    const [levels, history] = await Promise.all([
      getStockLevels(tx, locale.code, lowOnly ? { lowStock: true } : undefined),
      historyId !== null
        ? getStockAdjustments(tx, historyId, { limit: 20 })
        : Promise.resolve([] as StockAdjustment[]),
    ]);
    return { levels, history };
  });

  return { levels, history, historyId, lowOnly, manualReasons: MANUAL_REASONS, locale };
};

export const actions: Actions = {
  adjust: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const stockLevelId = Number(data.get('stock_level_id'));
    const delta = Number(data.get('delta'));
    const reason = data.get('reason') as AdjustmentReason;
    const note = (data.get('note') as string) || undefined;

    if (isNaN(stockLevelId) || isNaN(delta) || delta === 0)
      throw error(400, 'Invalid input');
    if (!MANUAL_REASONS.includes(reason)) throw error(400, 'Invalid reason');

    await locals.db.withUser((tx) =>
      adjustStock(tx, { stockLevelId, delta, reason, userAccountId, note }),
    );

    return { success: true };
  },

  setReorderPoint: async ({ locals, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const stockLevelId = Number(data.get('stock_level_id'));
    const raw = (data.get('reorder_point') as string) ?? '';
    const reorderPoint = raw.trim() === '' ? null : Number(raw);

    if (isNaN(stockLevelId) || (reorderPoint !== null && (isNaN(reorderPoint) || reorderPoint < 0)))
      throw error(400, 'Invalid input');

    await locals.db.withUser((tx) => setReorderPoint(tx, stockLevelId, reorderPoint));
    return { success: true };
  },
};
