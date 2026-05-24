import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (!session) throw redirect(303, '/sign-in')

  const { data: navItems } = await locals.supabase
    .from('navigation_item')
    .select('id, href, local_text_link:local_text_link_id(slug, scope)')
    .eq('scope', 'admin')
    .eq('active', true)
    .order('sort_order')

  return {
    navItems: navItems ?? [],
  }
}
