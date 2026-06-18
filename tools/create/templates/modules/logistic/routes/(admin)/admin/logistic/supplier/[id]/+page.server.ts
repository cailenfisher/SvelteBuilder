import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getSupplier,
  updateSupplier,
  upsertSupplierContact,
  deleteSupplierContact,
} from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const id = Number(params.id);
  if (Number.isNaN(id)) throw error(404, 'Not found');

  const supplier = await getSupplier(locals.supabase, id, locals.locale.code);
  if (!supplier) throw error(404, 'Supplier not found');

  return { supplier, locale: locals.locale };
};

export const actions: Actions = {
  update: async ({ locals, params, request }) => {
    const id = Number(params.id);
    const data = await request.formData();
    const slug = data.get('slug') as string;
    const leadTimeDay = data.get('lead_time_day') ? Number(data.get('lead_time_day')) : null;
    const active = data.get('active') === 'true';

    await updateSupplier(locals.supabase, id, { slug, leadTimeDay, active });
    return { success: true };
  },

  addContact: async ({ locals, params, request }) => {
    const supplierId = Number(params.id);
    const data = await request.formData();

    await upsertSupplierContact(locals.supabase, {
      supplierId,
      role: data.get('role') as string,
      name: data.get('name') as string,
      email: (data.get('email') as string) || null,
      phone: (data.get('phone') as string) || null,
    });

    return { success: true };
  },

  deleteContact: async ({ locals, request }) => {
    const data = await request.formData();
    const contactId = Number(data.get('contact_id'));
    await deleteSupplierContact(locals.supabase, contactId);
    return { success: true };
  },
};
