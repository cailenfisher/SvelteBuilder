import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getInboundReceipts, getSuppliers, createInboundReceipt } from '@sveltebuilder/logistic/server';
import type { InboundReceiptStatus } from '@sveltebuilder/logistic';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');
  const { locale } = locals;

  const status = (url.searchParams.get('status') ?? undefined) as InboundReceiptStatus | undefined;
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = 20;

  const { receipts, total, suppliers } = await locals.db.withUser(async (tx) => {
    const [receiptsResult, suppliers] = await Promise.all([
      getInboundReceipts(tx, locale.code, { status, page, perPage }),
      getSuppliers(tx, locale.code, { active: true }),
    ]);
    return { ...receiptsResult, suppliers };
  });

  return { receipts, total, status, page, perPage, suppliers, locale };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    // No supplier selected = blind receiving (ad-hoc inbound without a PO).
    const supplierId = data.get('supplier_id') ? Number(data.get('supplier_id')) : null;
    const expectedAt = (data.get('expected_at') as string) || undefined;
    const note = (data.get('note') as string) || undefined;

    const id = await locals.db.withUser((tx) =>
      createInboundReceipt(tx, { supplierId, userAccountId, expectedAt, note }),
    );

    throw redirect(303, `/admin/logistic/receipt/${id}`);
  },
};
