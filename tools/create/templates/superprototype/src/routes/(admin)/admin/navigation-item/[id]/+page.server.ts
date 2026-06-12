import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { supabase } = locals
  const id = parseInt(params.id)

  if (isNaN(id)) throw error(404, 'Not found')

  const { data: navItem, error: navError } = await supabase
    .from('navigation_item')
    .select('id, href, scope, sort_order, active, local_text_link:local_text_link_id(id, slug, scope)')
    .eq('id', id)
    .single()

  if (navError || !navItem) throw error(404, 'Navigation item not found')

  const linkId = (navItem.local_text_link as { id: number } | null)?.id

  const [textsResult, localesResult] = await Promise.all([
    linkId
      ? supabase.from('local_text').select('id, link, locale, content').eq('link', linkId)
      : Promise.resolve({ data: [] }),
    supabase.from('locale').select('id, code, native_name').order('code'),
  ])

  return {
    navItem,
    translations: textsResult.data ?? [],
    locales: (localesResult.data ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      nativeName: l.native_name,
    })),
  }
}

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const { supabase } = locals
    const id = parseInt(params.id)
    const form = await request.formData()

    const href = (form.get('href') as string | null)?.trim()
    const scope = (form.get('scope') as string | null)?.trim()
    const sort_order = parseInt((form.get('sort_order') as string | null) ?? '0') || 0
    const active = form.get('active') === 'on'

    if (isNaN(id) || !href || !scope) {
      return fail(422, { error: 'URL and scope are required.' })
    }

    const { error: updateError } = await supabase
      .from('navigation_item')
      .update({ href, scope, sort_order, active })
      .eq('id', id)

    if (updateError) return fail(500, { error: updateError.message })

    return { success: true }
  },

  updateText: async ({ params, request, locals }) => {
    const { supabase } = locals
    const navId = parseInt(params.id)
    const form = await request.formData()

    const localeId = parseInt(form.get('locale_id') as string)
    const content = (form.get('content') as string | null)?.trim() ?? ''

    if (isNaN(navId) || isNaN(localeId)) return fail(422, { error: 'Invalid parameters.' })

    const { data: navItem } = await supabase
      .from('navigation_item')
      .select('local_text_link_id')
      .eq('id', navId)
      .single()

    if (!navItem?.local_text_link_id) return fail(404, { error: 'Navigation item not found.' })

    const { error: upsertError } = await supabase
      .from('local_text')
      .upsert(
        { link: navItem.local_text_link_id, locale: localeId, content },
        { onConflict: 'link,locale' }
      )

    if (upsertError) return fail(500, { error: upsertError.message })

    return { success: true }
  },

  delete: async ({ params, locals }) => {
    const { supabase } = locals
    const id = parseInt(params.id)

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

    throw redirect(303, '/admin/navigation-item')
  },
}
