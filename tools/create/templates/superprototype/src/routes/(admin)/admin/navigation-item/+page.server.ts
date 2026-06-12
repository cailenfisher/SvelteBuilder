import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { supabase } = locals

  const { data } = await supabase
    .from('navigation_item')
    .select('id, href, scope, sort_order, active, local_text_link:local_text_link_id(id, slug, scope)')
    .order('scope')
    .order('sort_order')

  return {
    navItems: data ?? [],
  }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { supabase } = locals
    const form = await request.formData()

    const slug = (form.get('slug') as string | null)?.trim()
    const href = (form.get('href') as string | null)?.trim()
    const nav_scope = (form.get('nav_scope') as string | null)?.trim()
    const sort_order = parseInt((form.get('sort_order') as string | null) ?? '0') || 0

    if (!slug || !href || !nav_scope) {
      return fail(422, { error: 'Slug, URL, and scope are required.' })
    }

    const { data: link, error: linkError } = await supabase
      .from('local_text_link')
      .insert({ slug, scope: null, entity_id: null })
      .select('id')
      .single()

    if (linkError || !link) {
      return fail(422, { error: linkError?.message ?? 'Failed to create copy link.' })
    }

    const { error: navError } = await supabase
      .from('navigation_item')
      .insert({ local_text_link_id: link.id, href, scope: nav_scope, sort_order })

    if (navError) {
      await supabase.from('local_text_link').delete().eq('id', link.id)
      return fail(422, { error: navError.message })
    }

    return { success: true }
  },

  delete: async ({ request, locals }) => {
    const { supabase } = locals
    const form = await request.formData()
    const id = parseInt(form.get('id') as string)

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' })

    const { data: navItem } = await supabase
      .from('navigation_item')
      .select('local_text_link_id')
      .eq('id', id)
      .single()

    await supabase.from('navigation_item').delete().eq('id', id)

    if (navItem?.local_text_link_id) {
      await supabase.from('local_text').delete().eq('link', navItem.local_text_link_id)
      await supabase.from('local_text_link').delete().eq('id', navItem.local_text_link_id)
    }

    return { success: true }
  },
}
