import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { listLocale } from '$lib/server/locale';
import {
  deleteLocalTextEntry,
  getLocalTextLink,
  listLocalText,
  saveLocalText,
} from '$lib/server/local-text';
import { formError } from '$lib/server/form-error';
import { requireAdministrator } from '../../require-access';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  await requireAdministrator(parent);

  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [entryResult, translationResult, localeResult] = await Promise.all([
    getLocalTextLink(locals.supabase, id),
    listLocalText(locals.supabase, id),
    listLocale(locals.supabase),
  ]);

  if (entryResult.error || translationResult.error || localeResult.error) {
    throw error(500, 'Failed to load copy entry.');
  }
  if (!entryResult.data) throw error(404, 'Entry not found');

  return {
    entry: entryResult.data,
    translations: translationResult.data,
    locales: localeResult.data,
  };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const linkId = parseInt(params.id);
    const form = await request.formData();

    const localeId = parseInt(form.get('locale_id') as string);
    const content = (form.get('content') as string | null)?.trim() ?? '';

    if (isNaN(linkId) || isNaN(localeId)) return formError(422, 'error.parameters_invalid');

    const { error: upsertError } = await saveLocalText(locals.supabase, {
      link: linkId,
      locale: localeId,
      content,
    });

    if (upsertError) return formError(500, 'error.translation_save_failed');

    return { success: true as const };
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: rpcError } = await deleteLocalTextEntry(locals.supabase, id);

    if (rpcError) return formError(500, 'error.local_text_delete_failed');

    throw redirect(303, '/admin/local-text');
  },
};
