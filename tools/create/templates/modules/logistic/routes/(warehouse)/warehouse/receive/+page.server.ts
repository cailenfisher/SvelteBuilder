import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getInboundReceipts } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const { receipts } = await getInboundReceipts(locals.supabase, locals.locale.code, {
    perPage: 50,
  });

  const active = receipts.filter((r) => r.status === 'pending' || r.status === 'partial');
  const recent = receipts.filter((r) => r.status === 'complete').slice(0, 5);

  return { active, recent, locale: locals.locale };
};
