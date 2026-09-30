import { error, fail } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { SupplierDetailView } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin
// regardless of what reaches here. See the list screen's loader for the reasoning.

export const load: PageServerLoad = async ({ locals, params }): Promise<SupplierDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [supplierResult, copy] = await Promise.all([
    locals.supabase
      .from('supplier')
      .select('id, slug, lead_time_day, active, created_at, supplier_contact(id, supplier_id, role, name, email, phone, created_at)')
      .eq('id', id)
      .maybeSingle(),
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code,
    ),
  ]);

  if (supplierResult.error) throw error(500, 'Failed to load supplier.');
  // Null here also covers "RLS refused the row", which is the correct response to
  // give either way: a caller who may not read it should not learn it exists.
  if (!supplierResult.data) throw error(404, 'Supplier not found.');

  const row = supplierResult.data;

  return {
    supplier: {
      id: row.id,
      slug: row.slug,
      leadTimeDay: row.lead_time_day,
      active: row.active,
      createdAt: row.created_at,
      contacts: (row.supplier_contact ?? [])
        .map((contact) => ({
          id: contact.id,
          supplierId: contact.supplier_id,
          role: contact.role,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          createdAt: contact.created_at,
        }))
        .sort((a, b) => a.role.localeCompare(b.role)),
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

    const { error: updateError } = await locals.supabase
      .from('supplier')
      .update({
        slug,
        lead_time_day: leadTimeDay,
        active: form.get('active') === 'true',
      })
      .eq('id', id);

    if (updateError) return fail(500, { error: 'Failed to save the supplier.' });

    return { success: true as const };
  },

  addContact: async ({ locals, params, request }) => {
    const supplierId = Number(params.id);
    if (!Number.isInteger(supplierId)) throw error(404, 'Not found.');

    const form = await request.formData();
    const role = (form.get('role') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();

    if (!role || !name) return fail(422, { error: 'Role and name are required.' });

    const { error: insertError } = await locals.supabase.from('supplier_contact').insert({
      supplier_id: supplierId,
      role,
      name,
      email: ((form.get('email') as string | null)?.trim()) || null,
      phone: ((form.get('phone') as string | null)?.trim()) || null,
    });

    if (insertError) return fail(500, { error: 'Failed to add the contact.' });

    return { success: true as const };
  },

  deleteContact: async ({ locals, params, request }) => {
    const supplierId = Number(params.id);
    const form = await request.formData();
    const contactId = Number(form.get('contact_id'));

    if (!Number.isInteger(contactId)) return fail(422, { error: 'Invalid contact.' });

    // Scoped to this supplier as well as the contact id: without it, a crafted form
    // post could delete a contact belonging to a different supplier. RLS permits the
    // delete for any admin, so narrowing it is this route's job.
    const { error: deleteError } = await locals.supabase
      .from('supplier_contact')
      .delete()
      .eq('id', contactId)
      .eq('supplier_id', supplierId);

    if (deleteError) return fail(500, { error: 'Failed to remove the contact.' });

    return { success: true as const };
  },
};
