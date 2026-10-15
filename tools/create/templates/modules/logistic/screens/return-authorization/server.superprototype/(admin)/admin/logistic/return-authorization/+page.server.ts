import { error, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import {
  createReturnAuthorization,
  listReturnAuthorization,
} from '$lib/server/logistic/return-authorization';
import { RETURN_AUTHORIZATION_STATUSES } from '@sveltebuilder/logistic';
import type { ReturnAuthorizationListView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless. See the supplier list loader for the reasoning.

const PER_PAGE = 20;

export const load: PageServerLoad = async ({
  locals,
  url,
}): Promise<ReturnAuthorizationListView> => {
  const statusParam = url.searchParams.get('status');
  const status = RETURN_AUTHORIZATION_STATUSES.find((s) => s === statusParam) ?? null;

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [returnsResult, copy] = await Promise.all([
    listReturnAuthorization(
      locals.supabase,
      { status },
      { offset: (page - 1) * PER_PAGE, limit: PER_PAGE }
    ),
    loadScopedCopy(locals.supabase, ['logistic'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (returnsResult.error) throw error(500, 'Failed to load returns.');

  return {
    returnAuthorizations: returnsResult.data.rows,
    total: returnsResult.data.total,
    page,
    perPage: PER_PAGE,
    status,
    statuses: RETURN_AUTHORIZATION_STATUSES,
    localeCode: locals.locale.code,
    copy,
  };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    if (locals.userAccountId === null) return formError(403, 'logistic.error.not_signed_in');

    const form = await request.formData();
    const sku = (form.get('sku') as string | null)?.trim();
    const expectedQuantity = Number(form.get('expected_quantity'));

    if (!sku) return formError(422, 'logistic.error.sku_required');
    if (!Number.isInteger(expectedQuantity) || expectedQuantity < 1) {
      return formError(422, 'logistic.error.expected_quantity_invalid');
    }

    const { data: returnAuthorizationId, error: rpcError } = await createReturnAuthorization(
      locals.supabase,
      {
        userAccountId: locals.userAccountId,
        skus: [sku],
        quantities: [expectedQuantity],
        reason: (form.get('reason') as string | null)?.trim() || null,
        note: (form.get('note') as string | null)?.trim() || null,
      }
    );

    if (rpcError || returnAuthorizationId === null) {
      return formError(500, 'logistic.error.return_authorization_create_failed');
    }

    redirect(303, `/admin/logistic/return-authorization/${returnAuthorizationId}`);
  },
};
