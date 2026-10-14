import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  createNavigationItem,
  deleteNavigationItem,
  listNavigationItem,
} from '$lib/server/navigation-item';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: navItems, error: queryError } = await listNavigationItem(locals.supabase);

  if (queryError) throw error(500, 'Failed to load navigation items.');

  return { navItems };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const slug = (form.get('slug') as string | null)?.trim();
    const href = (form.get('href') as string | null)?.trim();
    const menu = (form.get('menu') as string | null)?.trim();
    const position = parseInt((form.get('position') as string | null) ?? '0') || 0;

    if (!slug || !href || !menu) {
      return fail(422, { error: 'Slug, URL, and menu are required.' });
    }

    const { error: rpcError } = await createNavigationItem(locals.supabase, {
      slug,
      href,
      menu,
      position,
    });

    if (rpcError) return fail(500, { error: 'Failed to create navigation item.' });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    const { error: rpcError } = await deleteNavigationItem(locals.supabase, id);

    if (rpcError) return fail(500, { error: 'Failed to delete navigation item.' });

    return { success: true };
  },
};
