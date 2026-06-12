import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { supabase } = locals
  const id = parseInt(params.id)

  if (isNaN(id)) throw error(404, 'Not found')

  const [linkResult, textsResult, localesResult] = await Promise.all([
    supabase
      .from('local_text_link')
      .select('id, slug, scope, entity_id')
      .eq('id', id)
      .single(),
    supabase.from('local_text').select('id, link, locale, content').eq('link', id),
    supabase.from('locale').select('id, code, native_name').order('code'),
  ])

  if (linkResult.error || !linkResult.data) throw error(404, 'Entry not found')

  return {
    entry: linkResult.data,
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
    const linkId = parseInt(params.id)
    const form = await request.formData()

    const localeId = parseInt(form.get('locale_id') as string)
    const content = (form.get('content') as string | null)?.trim() ?? ''

    if (isNaN(linkId) || isNaN(localeId)) return fail(422, { error: 'Invalid parameters.' })

    const { error: upsertError } = await supabase
      .from('local_text')
      .upsert(
        { link: linkId, locale: localeId, content },
        { onConflict: 'link,locale' }
      )

    if (upsertError) return fail(500, { error: upsertError.message })

    return { success: true }
  },

  delete: async ({ params, locals }) => {
    const { supabase } = locals
    const id = parseInt(params.id)

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' })

    await supabase.from('local_text').delete().eq('link', id)
    await supabase.from('local_text_link').delete().eq('id', id)

    throw redirect(303, '/admin/local-text')
  },
}
