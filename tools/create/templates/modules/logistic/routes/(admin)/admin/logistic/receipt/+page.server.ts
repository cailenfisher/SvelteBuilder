import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getInboundReceipts, getSuppliers, createInboundReceipt } from '@sveltebuilder/logistic/server';
import type { InboundReceiptStatus } from '@sveltebuilder/logistic';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const supabase = locals.supabase;
  const { locale } = locals;

  const status = (url.searchParams.get('status') ?? undefined) as InboundReceiptStatus | undefined;
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = 20;

  const [{ receipts, total }, suppliers] = await Promise.all([
    getInboundReceipts(supabase, locale.code, { status, page, perPage }),
    getSuppliers(supabase, locale.code, { active: true }),
  ]);

  return { receipts, total, status, page, perPage, suppliers, locale };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const supplierId = Number(data.get('supplier_id'));
    const expectedAt = (data.get('expected_at') as string) || undefined;
    const note = (data.get('note') as string) || undefined;

    const id = await createInboundReceipt(locals.supabase, {
      supplierId,
      userAccountId: session.user.id,
      expectedAt,
      note,
    });

    throw redirect(303, `/admin/logistic/receipt/${id}`);
  },
};
