import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { listLocale } from '$lib/server/locale';
import { listLocalText, saveLocalText } from '$lib/server/local-text';
import {
  deleteNavigationItem,
  getNavigationItem,
  updateNavigationItem,
} from '$lib/server/navigation-item';
import { formError } from '$lib/server/form-error';
import { requireAdministrator } from '../../require-administrator';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  await requireAdministrator(parent);

  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [navigationItemResult, localeResult] = await Promise.all([
    getNavigationItem(locals.supabase, id),
    listLocale(locals.supabase),
  ]);

  if (navigationItemResult.error || localeResult.error) {
    throw error(500, 'Failed to load navigation item.');
  }
  if (!navigationItemResult.data) throw error(404, 'Navigation item not found');

  const linkId = navigationItemResult.data.localTextLink?.id ?? null;

  const { data: translations, error: translationError } = linkId
    ? await listLocalText(locals.supabase, linkId)
    : { data: [], error: null };

  if (translationError) throw error(500, 'Failed to load translations.');

  return {
    navigationItem: navigationItemResult.data,
    translations,
    locales: localeResult.data,
  };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const form = await request.formData();

    const href = (form.get('href') as string | null)?.trim();
    const menu = (form.get('menu') as string | null)?.trim();
    const position = parseInt((form.get('position') as string | null) ?? '0') || 0;
    const active = form.get('active') === 'on';

    if (isNaN(id) || !href || !menu) {
      return formError(422, 'error.navigation_item_update_incomplete');
    }

    const { error: updateError } = await updateNavigationItem(locals.supabase, id, {
      href,
      menu,
      position,
      active,
    });

    if (updateError) return formError(500, 'error.navigation_item_update_failed');

    return { success: true as const };
  },

  updateText: async ({ params, request, locals }) => {
    const navigationItemId = parseInt(params.id);
    const form = await request.formData();

    const localeId = parseInt(form.get('locale_id') as string);
    const content = (form.get('content') as string | null)?.trim() ?? '';

    if (isNaN(navigationItemId) || isNaN(localeId)) return formError(422, 'error.parameters_invalid');

    // Read-then-write needs no transaction: if the upsert fails nothing changed.
    const { data: navigationItem, error: readError } = await getNavigationItem(locals.supabase, navigationItemId);

    if (readError) return formError(500, 'error.navigation_item_load_failed');
    if (!navigationItem) return formError(404, 'error.navigation_item_not_found');

    const { error: upsertError } = await saveLocalText(locals.supabase, {
      link: navigationItem.localTextLinkId,
      locale: localeId,
      content,
    });

    if (upsertError) return formError(500, 'error.translation_save_failed');

    return { success: true as const };
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: rpcError } = await deleteNavigationItem(locals.supabase, id);

    if (rpcError) return formError(500, 'error.navigation_item_delete_failed');

    throw redirect(303, '/admin/navigation-item');
  },
};
