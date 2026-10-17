import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  listActiveInboundReceipt,
  listRecentInboundReceipt,
} from '$lib/server/logistic/inbound-receipt';
import type { InboundReceiptWarehouseQueueView } from '@sveltebuilder/logistic/views';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
  locals,
}): Promise<InboundReceiptWarehouseQueueView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  // Two queries rather than one filtered in JS: the work queue and the recently-finished
  // list want different statuses, different orders and different sizes, and asking the
  // database for each is cheaper than fetching fifty rows to divide them up here — which is
  // what the original did, and it silently capped both lists at whatever the first fifty
  // happened to contain.
  const [activeResult, recentResult, copy] = await Promise.all([
    listActiveInboundReceipt(locals.supabase, 50),
    listRecentInboundReceipt(locals.supabase, 5),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (activeResult.error) throw error(500, 'Failed to load the receiving queue.');
  if (recentResult.error) throw error(500, 'Failed to load recent receipts.');

  return {
    activeInboundReceipts: activeResult.data,
    recentInboundReceipts: recentResult.data,
    localeCode: locals.locale.code,
    copy,
  };
};
