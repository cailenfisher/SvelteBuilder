import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { supabase } = locals

  const [linksResult, textsResult, localesResult] = await Promise.all([
    supabase.from('local_text_link').select('id, slug, scope, entity_id').order('slug'),
    supabase.from('local_text').select('id, link, locale, content'),
    supabase.from('locale').select('id, code, native_name').order('code'),
  ])

  return {
    entries: linksResult.data ?? [],
    translations: textsResult.data ?? [],
    locales: (localesResult.data ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      nativeName: l.native_name,
    })),
  }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { supabase } = locals
    const form = await request.formData()

    const slug = (form.get('slug') as string | null)?.trim()
    const scope = (form.get('scope') as string | null)?.trim() || null

    if (!slug) return fail(422, { error: 'Slug is required.' })

    const { data: link, error: linkError } = await supabase
      .from('local_text_link')
      .insert({ slug, scope, entity_id: null })
      .select('id')
      .single()

    if (linkError || !link) {
      return fail(422, { error: linkError?.message ?? 'Failed to create entry.' })
    }

    const localeIds = form.getAll('locale_id') as string[]
    const contents = form.getAll('content') as string[]

    const translations = localeIds
      .map((localeId, i) => ({ link: link.id, locale: parseInt(localeId), content: contents[i] }))
      .filter((t) => t.content?.trim())

    if (translations.length > 0) {
      await supabase.from('local_text').insert(translations)
    }

    return { success: true }
  },

  delete: async ({ request, locals }) => {
    const { supabase } = locals
    const form = await request.formData()
    const id = parseInt(form.get('id') as string)

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' })

    await supabase.from('local_text').delete().eq('link', id)
    await supabase.from('local_text_link').delete().eq('id', id)

    return { success: true }
  },
}
