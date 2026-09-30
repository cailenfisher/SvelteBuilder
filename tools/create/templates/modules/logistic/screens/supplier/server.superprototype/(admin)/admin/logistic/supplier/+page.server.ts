import { error } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { SupplierListView, SupplierWithContacts } from '@sveltebuilder/logistic/views';
import type { PageServerLoad } from './$types';

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
      .select('id, slug, lead_time_day, active, created_at, supplier_contact(id, supplier_id, role, name, email, phone, created_at)')
      .order('slug'),
    // Two scopes: the module's UI copy, and every supplier's own name.
    loadScopedCopy(locals.supabase, ['logistic', 'supplier'], locals.locale.code, locals.defaultLocale.code),
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
