import { error } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { countOpenCycleCount } from '$lib/server/logistic/cycle-count';
import { listInboundReceipt } from '$lib/server/logistic/inbound-receipt';
import { listOpenPickTask } from '$lib/server/logistic/pick-task';
import { listReturnAuthorization } from '$lib/server/logistic/return-authorization';
import { listStockLevel } from '$lib/server/logistic/stock-level';
import type { LogisticDashboardView } from '@sveltebuilder/logistic/views';
import type { PageServerLoad } from './$types';

// Guards live in the (admin) layout load. This screen writes nothing, so it has no actions.

const PREVIEW = 5;

export const load: PageServerLoad = async ({ locals }): Promise<LogisticDashboardView> => {
  // Each list returns its preview rows and its true total in one round trip.
  const preview = { offset: 0, limit: PREVIEW };

  const [receiptsResult, tasksResult, returnsResult, stockResult, cycleCountResult, copy] =
    await Promise.all([
      listInboundReceipt(locals.supabase, { status: 'pending' }, preview),
      listOpenPickTask(locals.supabase, PREVIEW),
      listReturnAuthorization(locals.supabase, { status: 'pending' }, preview),
      listStockLevel(locals.supabase, { lowOnly: true }),
      countOpenCycleCount(locals.supabase),
      loadScopedCopy(
        locals.supabase,
        ['logistic', 'supplier', 'storage_location'],
        locals.locale.code,
        locals.defaultLocale.code
      ),
    ]);

  if (receiptsResult.error) throw error(500, 'Failed to load receipts.');
  if (tasksResult.error) throw error(500, 'Failed to load pick tasks.');
  if (returnsResult.error) throw error(500, 'Failed to load returns.');
  if (stockResult.error) throw error(500, 'Failed to load stock levels.');
  if (cycleCountResult.error) throw error(500, 'Failed to count cycle counts.');

  return {
    metrics: {
      openPickTaskCount: tasksResult.data.total,
      pendingInboundReceiptCount: receiptsResult.data.total,
      openReturnAuthorizationCount: returnsResult.data.total,
      openCycleCountCount: cycleCountResult.data,
      // Counted from the filtered set rather than a separate query, since the filter is the
      // part PostgREST cannot express.
      lowStockCount: stockResult.data.length,
    },
    lowStockLevels: stockResult.data.slice(0, PREVIEW),
    pendingInboundReceipts: receiptsResult.data.rows,
    openPickTasks: tasksResult.data.rows,
    openReturnAuthorizations: returnsResult.data.rows,
    localeCode: locals.locale.code,
    copy,
  };
};
