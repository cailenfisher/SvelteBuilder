import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createLocale, deleteLocale, listLocale } from '$lib/server/locale';
import { formError } from '$lib/server/form-error';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: locales, error: queryError } = await listLocale(locals.supabase);

  if (queryError) throw error(500, 'Failed to load locales.');

  return { locales };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const code = (form.get('code') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();
    const nativeName = (form.get('native_name') as string | null)?.trim();
    const dir = (form.get('dir') as string | null)?.trim() || 'ltr';

    if (!code || !name || !nativeName) {
      return formError(422, 'error.locale_incomplete');
    }

    const { error: insertError } = await createLocale(locals.supabase, {
      code,
      name,
      nativeName,
      dir,
    });

    if (insertError) return formError(500, 'error.locale_create_failed');

    return { success: true as const };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: deleteError } = await deleteLocale(locals.supabase, id);

    if (deleteError) return formError(500, 'error.locale_delete_failed');

    return { success: true as const };
  },
};
