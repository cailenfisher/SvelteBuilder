import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { listLocale } from '$lib/server/locale';
import { listLocalText, saveLocalText } from '$lib/server/local-text';
import {
  deleteNavigationItem,
  getNavigationItem,
  updateNavigationItem,
} from '$lib/server/navigation-item';

export const load: PageServerLoad = async ({ params, locals }) => {
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
      return fail(422, { error: 'URL and menu are required.' });
    }

    const { error: updateError } = await updateNavigationItem(locals.supabase, id, {
      href,
      menu,
      position,
      active,
    });

    if (updateError) return fail(500, { error: 'Failed to update navigation item.' });

    return { success: true };
  },

  updateText: async ({ params, request, locals }) => {
    const navigationItemId = parseInt(params.id);
    const form = await request.formData();

    const localeId = parseInt(form.get('locale_id') as string);
    const content = (form.get('content') as string | null)?.trim() ?? '';

    if (isNaN(navigationItemId) || isNaN(localeId)) return fail(422, { error: 'Invalid parameters.' });

    // Read-then-write needs no transaction: if the upsert fails nothing changed.
    const { data: navigationItem, error: readError } = await getNavigationItem(locals.supabase, navigationItemId);

    if (readError) return fail(500, { error: 'Failed to load navigation item.' });
    if (!navigationItem) return fail(404, { error: 'Navigation item not found.' });

    const { error: upsertError } = await saveLocalText(locals.supabase, {
      link: navigationItem.localTextLinkId,
      locale: localeId,
      content,
    });

    if (upsertError) return fail(500, { error: 'Failed to save translation.' });

    return { success: true };
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    const { error: rpcError } = await deleteNavigationItem(locals.supabase, id);

    if (rpcError) return fail(500, { error: 'Failed to delete navigation item.' });

    throw redirect(303, '/admin/navigation-item');
  },
};
