import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  createNavigationItem,
  deleteNavigationItem,
  listNavigationItem,
} from '$lib/server/navigation-item';
import { formError } from '$lib/server/form-error';
import { requireAdministrator } from '../require-access';

export const load: PageServerLoad = async ({ locals, parent }) => {
  await requireAdministrator(parent);

  const { data: navigationItems, error: queryError } = await listNavigationItem(locals.supabase);

  if (queryError) throw error(500, 'Failed to load navigation items.');

  return { navigationItems };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const slug = (form.get('slug') as string | null)?.trim();
    const href = (form.get('href') as string | null)?.trim();
    const menu = (form.get('menu') as string | null)?.trim();
    const position = parseInt((form.get('position') as string | null) ?? '0') || 0;

    if (!slug || !href || !menu) {
      return formError(422, 'error.navigation_item_incomplete');
    }

    const { error: rpcError } = await createNavigationItem(locals.supabase, {
      slug,
      href,
      menu,
      position,
    });

    if (rpcError) return formError(500, 'error.navigation_item_create_failed');

    return { success: true as const };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return formError(422, 'error.id_invalid');

    const { error: rpcError } = await deleteNavigationItem(locals.supabase, id);

    if (rpcError) return formError(500, 'error.navigation_item_delete_failed');

    return { success: true as const };
  },
};
