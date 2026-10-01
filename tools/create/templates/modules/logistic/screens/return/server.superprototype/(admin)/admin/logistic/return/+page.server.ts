import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { ReturnAuthorizationStatus } from '@sveltebuilder/logistic';
import type { ReturnAuthorizationRow, ReturnListView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

const RETURN_STATUSES: ReturnAuthorizationStatus[] = [
  'pending',
  'received',
  'processed',
  'cancelled',
];

export const load: PageServerLoad = async ({ locals, url }): Promise<ReturnListView> => {
  const statusParam = url.searchParams.get('status');
  const status = RETURN_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const from = (page - 1) * PER_PAGE;

  let query = locals.supabase
    .from('return_authorization')
    .select(
      'id, shipment_id, user_account_id, status, reason, note, created_at, updated_at, return_authorization_line(count)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1);

  if (status !== null) query = query.eq('status', status);

  const [returnsResult, copy] = await Promise.all([
    query,
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (returnsResult.error) throw error(500, 'Failed to load returns.');

  const returns: ReturnAuthorizationRow[] = (returnsResult.data ?? []).map((row) => ({
    id: row.id,
    shipmentId: row.shipment_id,
    userAccountId: row.user_account_id,
    status: row.status,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineCount: row.return_authorization_line?.[0]?.count ?? 0,
  }));

  return {
    returns,
    total: returnsResult.count ?? returns.length,
    page,
    perPage: PER_PAGE,
    status,
    statuses: RETURN_STATUSES,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  // Two statements — the authorization and its lines — so an RPC, for the same reason as
  // creating a shipment: a return with no lines has nothing to grade and no way back.
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return fail(403, { error: 'Not signed in.' });

    const form = await request.formData();
    const sku = (form.get('sku') as string | null)?.trim();
    const expectedQuantity = Number(form.get('expected_quantity'));

    if (!sku) return fail(422, { error: 'SKU is required.' });
    if (!Number.isInteger(expectedQuantity) || expectedQuantity < 1) {
      return fail(422, { error: 'Expected quantity must be a positive whole number.' });
    }

    const { data, error: rpcError } = await locals.supabase.rpc(
      'logistic_create_return_authorization',
      {
        p_user_account_id: locals.userAccountId,
        p_skus: [sku],
        p_quantities: [expectedQuantity],
        p_reason: (form.get('reason') as string | null)?.trim() || null,
        p_note: (form.get('note') as string | null)?.trim() || null,
      }
    );

    if (rpcError || data === null) return fail(500, { error: 'Failed to create the return.' });

    redirect(303, `/admin/logistic/return/${data}`);
  },
};
