import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getLogisticMetrics, getInboundReceipts, getPickTasks, getReturnAuthorizations } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const supabase = locals.supabase;
  const { locale } = locals;

  const [metrics, recentReceiptsResult, openTasksResult, openReturnsResult] = await Promise.all([
    getLogisticMetrics(supabase),
    getInboundReceipts(supabase, locale.code, { status: 'pending', perPage: 5 }),
    getPickTasks(supabase, { status: 'open', perPage: 5 }),
    getReturnAuthorizations(supabase, { status: 'pending', perPage: 5 }),
  ]);

  return {
    metrics,
    recentReceipts: recentReceiptsResult.receipts,
    openTasks: openTasksResult.tasks,
    openReturns: openReturnsResult.returns,
    locale,
  };
};
