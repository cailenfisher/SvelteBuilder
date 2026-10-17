import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { listLocale } from '$lib/server/locale';
import {
  createLocalTextEntry,
  deleteLocalTextEntry,
  listLocalText,
  listLocalTextLink,
} from '$lib/server/local-text';
import { formError } from '$lib/server/form-error';

export const load: PageServerLoad = async ({ locals }) => {
  const [entryResult, translationResult, localeResult] = await Promise.all([
    listLocalTextLink(locals.supabase),
    listLocalText(locals.supabase),
    listLocale(locals.supabase),
  ]);

  if (entryResult.error || translationResult.error || localeResult.error) {
    throw error(500, 'Failed to load copy entries.');
  }

  return {
    entries: entryResult.data,
    translations: translationResult.data,
    locales: localeResult.data,
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const slug = (form.get('slug') as string | null)?.trim();
    const scope = (form.get('scope') as string | null)?.trim() || null;

    if (!slug) return formError(422, 'error.slug_required');

    const localeIds = (form.getAll('locale_id') as string[]).map((v) => parseInt(v));
    const contents = form.getAll('content') as string[];

    if (localeIds.some(isNaN)) return formError(422, 'error.locale_invalid');

    const { error: rpcError } = await createLocalTextEntry(locals.supabase, {
      slug,
      scope,
      entityId: null,
      localeIds,
      contents,
    });

    if (rpcError) return formError(500, 'error.local_text_create_failed');

    return { success: true as const };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: rpcError } = await deleteLocalTextEntry(locals.supabase, id);

    if (rpcError) return formError(500, 'error.local_text_delete_failed');

    return { success: true as const };
  },
};
