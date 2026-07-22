import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  getLogisticMetrics,
  getInboundReceipts,
  getPickTasks,
  getReturnAuthorizations,
  getStockLevels,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');
  const { locale } = locals;

  const { metrics, recentReceipts, openTasks, openReturns, lowStockLevels } =
    await locals.db.withUser(async (tx) => {
      const [metrics, receiptsResult, tasksResult, returnsResult, lowStockLevels] =
        await Promise.all([
          getLogisticMetrics(tx),
          getInboundReceipts(tx, locale.code, { status: 'pending', perPage: 5 }),
          getPickTasks(tx, { status: 'open', perPage: 5 }),
          getReturnAuthorizations(tx, { status: 'pending', perPage: 5 }),
          getStockLevels(tx, locale.code, { lowStock: true }),
        ]);
      return {
        metrics,
        recentReceipts: receiptsResult.receipts,
        openTasks: tasksResult.tasks,
        openReturns: returnsResult.returns,
        lowStockLevels,
      };
    });

  return { metrics, recentReceipts, openTasks, openReturns, lowStockLevels, locale };
};
