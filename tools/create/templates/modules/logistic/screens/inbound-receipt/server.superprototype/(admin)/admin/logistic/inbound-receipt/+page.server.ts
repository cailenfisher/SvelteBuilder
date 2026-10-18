import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { createInboundReceipt, listInboundReceipt } from '$lib/server/logistic/inbound-receipt';
import { listSupplierOption } from '$lib/server/logistic/supplier';
import { INBOUND_RECEIPT_STATUSES } from '@sveltebuilder/logistic';
import type { InboundReceiptListView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';
import { listCurrentUserAction } from '$lib/server/permission';
import { requireScope } from '../../require-access';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ parent, locals, url }): Promise<InboundReceiptListView> => {
  await requireScope(parent, 'inbound_receipt');
  const { data: actions, error: actionError } = await listCurrentUserAction(locals.supabase, 'inbound_receipt');
  if (actionError) throw error(500, 'Failed to load your permissions.');

  // Validated against the enum rather than cast: a query string is user input, and
  // PostgREST would reject an unknown enum value with a 400 the screen cannot explain.
  const statusParam = url.searchParams.get('status');
  const status = INBOUND_RECEIPT_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [receiptsResult, suppliersResult, copy] = await Promise.all([
    listInboundReceipt(
      locals.supabase,
      { status },
      { offset: (page - 1) * PER_PAGE, limit: PER_PAGE }
    ),
    listSupplierOption(locals.supabase),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (receiptsResult.error) throw error(500, 'Failed to load receipts.');
  if (suppliersResult.error) throw error(500, 'Failed to load suppliers.');

  return {
    actions,
    inboundReceipts: receiptsResult.data.rows,
    total: receiptsResult.data.total,
    page,
    perPage: PER_PAGE,
    status,
    suppliers: suppliersResult.data,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const supplierRaw = (form.get('supplier_id') as string | null)?.trim();
    const expectedAt = (form.get('expected_at') as string | null)?.trim() || null;
    const note = (form.get('note') as string | null)?.trim() || null;

    // No supplier is not a missing field: a blind receipt is goods arriving with no
    // purchase order to match them to, which the schema allows by design.
    const supplierId = supplierRaw ? Number(supplierRaw) : null;
    if (supplierId !== null && !Number.isInteger(supplierId)) {
      return formError(422, 'logistic.error.supplier_invalid');
    }

    const { data: inboundReceiptId, error: insertError } = await createInboundReceipt(
      locals.supabase,
      { supplierId, userAccountId: locals.userAccountId, expectedAt, note }
    );

    if (insertError) return formError(500, 'logistic.error.inbound_receipt_create_failed');

    redirect(303, `/admin/logistic/inbound-receipt/${inboundReceiptId}`);
  },
};
