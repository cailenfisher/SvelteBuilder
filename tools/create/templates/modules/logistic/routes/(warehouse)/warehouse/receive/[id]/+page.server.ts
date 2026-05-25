import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getInboundReceipt, receiveReceiptLine } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (isNaN(id)) throw error(400, 'Invalid receipt ID');

  const receipt = await getInboundReceipt(locals.supabase, id, locals.locale.code);
  if (!receipt) throw error(404, 'Receipt not found');
  if (receipt.status === 'cancelled') throw error(410, 'Receipt has been cancelled');

  return { receipt, locale: locals.locale };
};

export const actions: Actions = {
  receive: async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const formData = await request.formData();
    const lineId = Number(formData.get('line_id'));
    const quantity = Number(formData.get('quantity'));

    if (isNaN(lineId) || isNaN(quantity) || quantity < 0)
      throw error(400, 'Invalid input');

    await receiveReceiptLine(locals.supabase, lineId, quantity, session.user.id);
    return { success: true };
  },
};
