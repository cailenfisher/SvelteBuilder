import { error, fail, redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import { createSupplier, listSupplier } from '$lib/server/logistic/supplier';
import type { SupplierListView } from '@sveltebuilder/logistic/views';
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
    listSupplier(locals.supabase),
    // Two scopes: the module's UI copy, and every supplier's own name.
    loadScopedCopy(
      locals.supabase,
      ['logistic', 'supplier'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  if (suppliersResult.error) throw error(500, 'Failed to load suppliers.');

  return { suppliers: suppliersResult.data, copy };
};

export const actions: Actions = {
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

    // The name is captured in the locale the admin is working in.
    const { data: supplierId, error: rpcError } = await createSupplier(locals.supabase, {
      slug,
      name,
      localeId: locals.locale.id,
      leadTimeDay,
    });

    if (rpcError) {
      // 23505 is unique_violation: the slug is already taken, which is a user error
      // rather than a server fault and should not read as one.
      if (rpcError.code === '23505') return fail(409, { error: 'That slug is already in use.' });
      return fail(500, { error: 'Failed to create the supplier.' });
    }
    if (supplierId === null) return fail(500, { error: 'Failed to create the supplier.' });

    redirect(303, `/admin/logistic/supplier/${supplierId}`);
  },
};
