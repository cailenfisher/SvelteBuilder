import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getShipments, createShipment } from '@sveltebuilder/logistic/server';
import type { ShipmentStatus } from '@sveltebuilder/logistic';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const status = (url.searchParams.get('status') ?? undefined) as ShipmentStatus | undefined;
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = 20;

  const { shipments, total } = await locals.db.withUser((tx) =>
    getShipments(tx, { status, page, perPage }),
  );

  return { shipments, total, status, page, perPage, locale: locals.locale };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const userAccountId = locals.userAccountId;
    if (userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const carrier = (data.get('carrier') as string) || undefined;
    const serviceLevel = (data.get('service_level') as string) || undefined;
    const sku = (data.get('sku') as string)?.trim();
    const quantity = Number(data.get('quantity'));

    if (!sku || isNaN(quantity) || quantity < 1) throw error(400, 'Invalid input');

    const id = await locals.db.withUser((tx) =>
      createShipment(tx, {
        userAccountId,
        carrier,
        serviceLevel,
        lines: [{ sku, quantity }],
      }),
    );

    throw redirect(303, `/admin/logistic/shipment/${id}`);
  },
};
