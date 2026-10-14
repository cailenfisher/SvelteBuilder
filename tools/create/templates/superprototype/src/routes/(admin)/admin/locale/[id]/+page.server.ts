import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { deleteLocale, getLocale, updateLocale } from '$lib/server/locale';

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const { data: locale, error: queryError } = await getLocale(locals.supabase, id);

  if (queryError) throw error(500, 'Failed to load locale.');
  if (!locale) throw error(404, 'Locale not found');

  return { locale };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const form = await request.formData();

    const code = (form.get('code') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();
    const nativeName = (form.get('native_name') as string | null)?.trim();
    const dir = (form.get('dir') as string | null)?.trim() || 'ltr';

    if (isNaN(id) || !code || !name || !nativeName) {
      return fail(422, { error: 'Code, name, and native name are required.' });
    }

    const { error: updateError } = await updateLocale(locals.supabase, id, {
      code,
      name,
      nativeName,
      dir,
    });

    if (updateError) return fail(500, { error: 'Failed to update locale.' });

    return { success: true };
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    const { error: deleteError } = await deleteLocale(locals.supabase, id);

    if (deleteError) return fail(500, { error: 'Failed to delete locale.' });

    throw redirect(303, '/admin/locale');
  },
};
