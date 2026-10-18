import type { SupabaseClient } from '@supabase/supabase-js';
import type { LocalTextLink } from 'diglossia';
import type { NavigationItem } from '$lib/server/schema';
import { toOne, type QueryResult } from '$lib/server/postgrest';

/** A navigation item with the copy link its label is read through. */
export type NavigationItemWithLocalTextLink = Pick<
  NavigationItem,
  'id' | 'localTextLinkId' | 'href' | 'menu' | 'position' | 'active' | 'permissionScope'
> & {
  localTextLink: Pick<LocalTextLink, 'id' | 'slug' | 'scope'> | null;
};

/** A navigation item as an administrator edits it. */
export type NavigationItemFields = Pick<NavigationItem, 'href' | 'menu' | 'position' | 'active'>;

const selectNavigationItem = (supabase: SupabaseClient) =>
  supabase
    .from('navigation_item')
    .select(
      'id, local_text_link_id, href, menu, position, active, permission_scope, local_text_link(id, slug, scope)'
    );

type NavigationItemRecord = NonNullable<
  Awaited<ReturnType<typeof selectNavigationItem>>['data']
>[number];

const toNavigationItem = (row: NavigationItemRecord): NavigationItemWithLocalTextLink => ({
  id: row.id,
  localTextLinkId: row.local_text_link_id,
  href: row.href,
  menu: row.menu,
  position: row.position,
  active: row.active,
  permissionScope: row.permission_scope,
  localTextLink: toOne(row.local_text_link),
});

/** Every navigation item in every menu, for the administration screen. */
export async function listNavigationItem(
  supabase: SupabaseClient
): Promise<QueryResult<NavigationItemWithLocalTextLink[]>> {
  const { data, error } = await selectNavigationItem(supabase).order('menu').order('position');
  if (error) return { data: null, error };
  return { data: data.map(toNavigationItem), error: null };
}

/** The active items of one menu, in display order. */
export async function listMenuNavigationItem(
  supabase: SupabaseClient,
  menu: string
): Promise<QueryResult<NavigationItemWithLocalTextLink[]>> {
  const { data, error } = await selectNavigationItem(supabase)
    .eq('menu', menu)
    .eq('active', true)
    .order('position');
  if (error) return { data: null, error };
  return { data: data.map(toNavigationItem), error: null };
}

export async function getNavigationItem(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<NavigationItemWithLocalTextLink | null>> {
  const { data, error } = await selectNavigationItem(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  return { data: data ? toNavigationItem(data) : null, error: null };
}

/**
 * One RPC: the copy link and the item have to land together, or a failure leaves an orphaned
 * link behind.
 */
export async function createNavigationItem(
  supabase: SupabaseClient,
  fields: Pick<NavigationItem, 'href' | 'menu' | 'position'> & { slug: string }
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('create_navigation_item', {
    p_slug: fields.slug,
    p_href: fields.href,
    p_menu: fields.menu,
    p_position: fields.position,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}

export async function updateNavigationItem(
  supabase: SupabaseClient,
  id: number,
  fields: NavigationItemFields
): Promise<QueryResult<null>> {
  const { error } = await supabase.from('navigation_item').update(fields).eq('id', id);
  if (error) return { data: null, error };
  return { data: null, error: null };
}

/** Removes the item and its copy link together. */
export async function deleteNavigationItem(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('delete_navigation_item', { p_id: id });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
