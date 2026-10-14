import { error, fail } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { addSupplierContact, deleteSupplierContact } from '$lib/server/logistic/supplier-contact';
import { getSupplier, updateSupplier } from '$lib/server/logistic/supplier';
import type { SupplierDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless of what reaches here. See the list screen's loader for the reasoning.

export const load: PageServerLoad = async ({ locals, params }): Promise<SupplierDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [supplierResult, copy] = await Promise.all([
    getSupplier(locals.supabase, id),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (supplierResult.error) throw error(500, 'Failed to load supplier.');
  if (!supplierResult.data) throw error(404, 'Supplier not found.');

  const supplier = supplierResult.data;

  return {
    supplier: {
      ...supplier,
      contacts: [...supplier.contacts].sort((a, b) => a.role.localeCompare(b.role)),
    },
    copy,
  };
};

// Each action is a single statement, so each is one plain supabase-js call. An RPC
// would only be needed where a partial result would be garbage — see
// supabase/supplemental/04-admin-write-rpc.sql for that case.
export const actions: Actions = {
  update: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();
    const slug = (form.get('slug') as string | null)?.trim();
    const leadTimeRaw = (form.get('lead_time_day') as string | null)?.trim();

    if (!slug) return fail(422, { error: 'Slug is required.' });

    const leadTimeDay = leadTimeRaw ? Number(leadTimeRaw) : null;
    if (leadTimeDay !== null && (!Number.isInteger(leadTimeDay) || leadTimeDay < 0)) {
      return fail(422, { error: 'Lead time must be a whole number of days.' });
    }

    const { error: updateError } = await updateSupplier(locals.supabase, id, {
      slug,
      leadTimeDay,
      active: form.get('active') === 'true',
    });

    if (updateError) return fail(500, { error: 'Failed to save the supplier.' });

    return { success: true as const };
  },

  addSupplierContact: async ({ locals, params, request }) => {
    const supplierId = Number(params.id);
    if (!Number.isInteger(supplierId)) throw error(404, 'Not found.');

    const form = await request.formData();
    const role = (form.get('role') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();

    if (!role || !name) return fail(422, { error: 'Role and name are required.' });

    const { error: insertError } = await addSupplierContact(locals.supabase, supplierId, {
      role,
      name,
      email: (form.get('email') as string | null)?.trim() || null,
      phone: (form.get('phone') as string | null)?.trim() || null,
    });

    if (insertError) return fail(500, { error: 'Failed to add the contact.' });

    return { success: true as const };
  },

  deleteSupplierContact: async ({ locals, params, request }) => {
    const supplierId = Number(params.id);
    const form = await request.formData();
    const contactId = Number(form.get('supplier_contact_id'));

    if (!Number.isInteger(contactId)) return fail(422, { error: 'Invalid contact.' });

    const { error: deleteError } = await deleteSupplierContact(
      locals.supabase,
      supplierId,
      contactId
    );

    if (deleteError) return fail(500, { error: 'Failed to remove the contact.' });

    return { success: true as const };
  },
};
