import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { toOne } from '$lib/server/postgrest';

export const load: PageServerLoad = async ({ locals }) => {
  const { data, error: queryError } = await locals.supabase
    .from('navigation_item')
    .select('id, href, menu, position, active, local_text_link(id, slug, scope)')
    .order('menu')
    .order('position');

  if (queryError) throw error(500, 'Failed to load navigation items.');

  const navItems = (data ?? []).map((row) => ({
    id: row.id,
    href: row.href,
    menu: row.menu,
    position: row.position,
    active: row.active,
    localTextLink: toOne(row.local_text_link),
  }));

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

    // One RPC: the copy link and the nav item have to land together or a failure
    // leaves an orphaned link behind.
    const { error: rpcError } = await locals.supabase.rpc('create_navigation_item', {
      p_slug: slug,
      p_href: href,
      p_menu: menu,
      p_position: position,
    });

    if (rpcError) return fail(500, { error: 'Failed to create navigation item.' });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    const { error: rpcError } = await locals.supabase.rpc('delete_navigation_item', {
      p_id: id,
    });

    if (rpcError) return fail(500, { error: 'Failed to delete navigation item.' });

    return { success: true };
  },
};
