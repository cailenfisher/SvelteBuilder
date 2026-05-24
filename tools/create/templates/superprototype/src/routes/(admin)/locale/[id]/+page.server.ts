import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { supabase } = locals
  const id = parseInt(params.id)

  if (isNaN(id)) throw error(404, 'Not found')

  const { data, error: queryError } = await supabase
    .from('locale')
    .select('id, code, name, native_name, dir')
    .eq('id', id)
    .single()

  if (queryError || !data) throw error(404, 'Locale not found')

  return {
    locale: {
      id: data.id,
      code: data.code,
      name: data.name,
      nativeName: data.native_name,
      dir: data.dir,
    },
  }
}

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const { supabase } = locals
    const id = parseInt(params.id)
    const form = await request.formData()

    const code = (form.get('code') as string | null)?.trim()
    const name = (form.get('name') as string | null)?.trim()
    const native_name = (form.get('native_name') as string | null)?.trim()
    const dir = (form.get('dir') as string | null)?.trim() || 'ltr'

    if (isNaN(id) || !code || !name || !native_name) {
      return fail(422, { error: 'Code, name, and native name are required.' })
    }

    const { error: updateError } = await supabase
      .from('locale')
      .update({ code, name, native_name, dir })
      .eq('id', id)

    if (updateError) return fail(500, { error: updateError.message })

    return { success: true }
  },

  delete: async ({ params, locals }) => {
    const { supabase } = locals
    const id = parseInt(params.id)

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' })

    const { error: deleteError } = await supabase.from('locale').delete().eq('id', id)

    if (deleteError) return fail(500, { error: deleteError.message })

    throw redirect(303, '/admin/locale')
  },
}
