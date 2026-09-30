import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getReturnAuthorizations, createReturnAuthorization } from '@sveltebuilder/logistic/server';
import type { ReturnAuthorizationStatus } from '@sveltebuilder/logistic';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const status = (url.searchParams.get('status') ?? undefined) as ReturnAuthorizationStatus | undefined;
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = 20;

  const { returns, total } = await locals.db.withUser((tx) =>
    getReturnAuthorizations(tx, { status, page, perPage }),
  );

  return { returns, total, status, page, perPage, locale: locals.locale };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const reason = (data.get('reason') as string) || undefined;
    const note = (data.get('note') as string) || undefined;
    const sku = data.get('sku') as string;
    const expectedQuantity = Number(data.get('expected_quantity'));

    const id = await locals.db.withUser((tx) =>
      createReturnAuthorization(tx, {
        userAccountId,
        reason,
        note,
        lines: [{ sku, expectedQuantity }],
      }),
    );

    throw redirect(303, `/admin/logistic/return/${id}`);
  },
};
