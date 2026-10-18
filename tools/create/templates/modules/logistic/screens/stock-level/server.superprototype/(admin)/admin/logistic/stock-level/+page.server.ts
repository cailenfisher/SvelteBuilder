import { error } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { listStockAdjustment } from '$lib/server/logistic/stock-adjustment';
import {
  adjustStockLevel,
  listStockLevel,
  setStockLevelReorderPoint,
} from '$lib/server/logistic/stock-level';
import type { StockAdjustmentReason } from '@sveltebuilder/logistic';
import type { StockLevelListView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';
import { listCurrentUserAction } from '$lib/server/permission';
import { requireScope } from '../../require-access';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

// Reasons a human may choose. The operational ones — inbound_receipt, pick,
// return_restock, cycle_count_variance — are written by the workflows that cause them,
// so offering them here would let an operator record a movement that never happened.
const MANUAL_REASONS: StockAdjustmentReason[] = [
  'damage',
  'theft',
  'receiving_error',
  'system_correction',
  'other',
];

export const load: PageServerLoad = async ({ parent, locals, url }): Promise<StockLevelListView> => {
  await requireScope(parent, 'stock_level');
  const { data: actions, error: actionError } = await listCurrentUserAction(locals.supabase, 'stock_level');
  if (actionError) throw error(500, 'Failed to load your permissions.');

  const historyParam = url.searchParams.get('history');
  const historyStockLevelId =
    historyParam !== null && /^\d+$/.test(historyParam) ? Number(historyParam) : null;
  const lowOnly = url.searchParams.get('filter') === 'low';

  const [levelsResult, historyResult, copy] = await Promise.all([
    listStockLevel(locals.supabase, { lowOnly }),
    historyStockLevelId !== null
      ? listStockAdjustment(locals.supabase, historyStockLevelId, 20)
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

  return {
    actions,
    stockLevels: levelsResult.data,
    stockAdjustments: historyResult.data,
    historyStockLevelId,
    lowOnly,
    manualReasons: MANUAL_REASONS,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  adjust: async ({ locals, request }) => {
    const form = await request.formData();
    const stockLevelId = Number(form.get('stock_level_id'));
    const delta = Number(form.get('delta'));
    const reason = form.get('reason') as StockAdjustmentReason | null;
    const note = (form.get('note') as string | null)?.trim() || null;

    if (!Number.isInteger(stockLevelId)) return formError(422, 'logistic.error.stock_level_invalid');
    if (!Number.isInteger(delta) || delta === 0) {
      return formError(422, 'logistic.error.adjustment_quantity_invalid');
    }
    // Checked against the same list the screen offers, because a form post is not
    // bound by what the select rendered.
    if (reason === null || !MANUAL_REASONS.includes(reason)) {
      return formError(422, 'logistic.error.adjustment_reason_required');
    }
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const { error: rpcError } = await adjustStockLevel(locals.supabase, {
      stockLevelId,
      delta,
      reason,
      note,
    });

    if (rpcError) {
      // A negative on_hand is a real answer to the operator rather than a fault: they
      // tried to remove more than is there. 23514 is check_violation.
      if (rpcError.code === '23514') {
        return formError(409, 'logistic.error.negative_stock');
      }
      return formError(500, 'logistic.error.adjustment_failed');
    }

    return { success: true as const };
  },

  setReorderPoint: async ({ locals, request }) => {
    const form = await request.formData();
    const stockLevelId = Number(form.get('stock_level_id'));
    const raw = ((form.get('reorder_point') as string | null) ?? '').trim();
    const reorderPoint = raw === '' ? null : Number(raw);

    if (!Number.isInteger(stockLevelId)) return formError(422, 'logistic.error.stock_level_invalid');
    if (reorderPoint !== null && (!Number.isInteger(reorderPoint) || reorderPoint < 0)) {
      return formError(422, 'logistic.error.reorder_point_invalid');
    }

    const { error: updateError } = await setStockLevelReorderPoint(
      locals.supabase,
      stockLevelId,
      reorderPoint
    );

    if (updateError) return formError(500, 'logistic.error.reorder_point_save_failed');

    return { success: true as const };
  },
};
