import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getSupplier,
  updateSupplier,
  upsertSupplierContact,
  deleteSupplierContact,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const supplier = await locals.db.withUser((tx) =>
    getSupplier(tx, id, locals.locale.code),
  );
  if (!supplier) throw error(404, 'Supplier not found');

  return { supplier, locale: locals.locale };
};

export const actions: Actions = {
  update: async ({ locals, params, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const id = Number(params.id);
    const data = await request.formData();
    const slug = data.get('slug') as string;
    const leadTimeDay = data.get('lead_time_day') ? Number(data.get('lead_time_day')) : null;
    const active = data.get('active') === 'true';

    await locals.db.withUser((tx) => updateSupplier(tx, id, { slug, leadTimeDay, active }));
    return { success: true };
  },

  addContact: async ({ locals, params, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const supplierId = Number(params.id);
    const data = await request.formData();

    await locals.db.withUser((tx) =>
      upsertSupplierContact(tx, {
        supplierId,
        role: data.get('role') as string,
        name: data.get('name') as string,
        email: (data.get('email') as string) || null,
        phone: (data.get('phone') as string) || null,
      }),
    );

    return { success: true };
  },

  deleteContact: async ({ locals, request }) => {
    if (locals.userAccountId === null) throw redirect(303, '/sign-in');

    const data = await request.formData();
    const contactId = Number(data.get('contact_id'));
    await locals.db.withUser((tx) => deleteSupplierContact(tx, contactId));
    return { success: true };
  },
};
