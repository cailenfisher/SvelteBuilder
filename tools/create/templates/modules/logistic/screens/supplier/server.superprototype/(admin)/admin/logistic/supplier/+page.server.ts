import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { SupplierListView, SupplierWithContacts } from '@sveltebuilder/logistic/views';
import type { Actions, PageServerLoad } from './$types';

// No auth guard here: the (admin) layout's load already redirects an anonymous
// visitor to /sign-in and 403s a non-admin, and RLS refuses the read regardless.
// Repeating the check per route would only add a place for it to drift.
//
// The return type is annotated with the view rather than inferred, so a screen and
// this loader disagreeing is a compile error here rather than a runtime surprise
// there. @sveltebuilder/logistic/views is the contract both sides import.
export const load: PageServerLoad = async ({ locals }): Promise<SupplierListView> => {
  const [suppliersResult, copy] = await Promise.all([
    locals.supabase
      .from('supplier')
      .select(
        'id, slug, lead_time_day, active, created_at, supplier_contact(id, supplier_id, role, name, email, phone, created_at)'
      )
      .order('slug'),
    // Two scopes: the module's UI copy, and every supplier's own name.
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (suppliersResult.error) throw error(500, 'Failed to load suppliers.');

  const suppliers: SupplierWithContacts[] = (suppliersResult.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    leadTimeDay: row.lead_time_day,
    active: row.active,
    createdAt: row.created_at,
    // supplier_contact is a to-many embed, so it genuinely is an array — unlike a
    // to-one embed, where toOne() from $lib/server/postgrest undoes supabase-js's
    // blanket array typing.
    contacts: (row.supplier_contact ?? []).map((contact) => ({
      id: contact.id,
      supplierId: contact.supplier_id,
      role: contact.role,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      createdAt: contact.created_at,
    })),
  }));

  return { suppliers, copy };
};

export const actions: Actions = {
  // Three statements — the supplier, its local_text_link, its local_text — so this goes
  // through an RPC. It is SECURITY INVOKER, so RLS still checks each one; see
  // supabase/supplemental/05-logistic-supplements.sql. A plain insert here would leave a
  // supplier whose name renders [missing: name] if the second or third statement failed.
  create: async ({ locals, request }) => {
    const form = await request.formData();
    const slug = (form.get('slug') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();
    const leadTimeRaw = (form.get('lead_time_day') as string | null)?.trim();

    if (!slug) return fail(422, { error: 'Slug is required.' });
    if (!name) return fail(422, { error: 'Name is required.' });

    const leadTimeDay = leadTimeRaw ? Number(leadTimeRaw) : null;
    if (leadTimeDay !== null && (!Number.isInteger(leadTimeDay) || leadTimeDay < 0)) {
      return fail(422, { error: 'Lead time must be a whole number of days.' });
    }

    // The name is captured in the locale the admin is working in. Other locales are
    // added through the local-text admin screens the base scaffold ships.
    const { data, error: rpcError } = await locals.supabase.rpc('logistic_create_supplier', {
      p_slug: slug,
      p_name: name,
      p_locale_id: locals.locale.id,
      p_lead_time_day: leadTimeDay,
    });

    if (rpcError) {
      // 23505 is unique_violation: the slug is already taken, which is a user error
      // rather than a server fault and should not read as one.
      if (rpcError.code === '23505') return fail(409, { error: 'That slug is already in use.' });
      return fail(500, { error: 'Failed to create the supplier.' });
    }

    redirect(303, `/admin/logistic/supplier/${data}`);
  },
};
