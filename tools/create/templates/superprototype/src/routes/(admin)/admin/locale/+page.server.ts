import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { supabase } = locals

  const { data } = await supabase
    .from('locale')
    .select('id, code, name, native_name, dir')
    .order('code')

  return {
    locales: (data ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      nativeName: l.native_name,
      dir: l.dir,
    })),
  }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { supabase } = locals
    const form = await request.formData()

    const code = (form.get('code') as string | null)?.trim()
    const name = (form.get('name') as string | null)?.trim()
    const native_name = (form.get('native_name') as string | null)?.trim()
    const dir = (form.get('dir') as string | null)?.trim() || 'ltr'

    if (!code || !name || !native_name) {
      return fail(422, { error: 'Code, name, and native name are required.' })
    }

    const { error: insertError } = await supabase
      .from('locale')
      .insert({ code, name, native_name, dir })

    if (insertError) return fail(422, { error: insertError.message })

    return { success: true }
  },

  delete: async ({ request, locals }) => {
    const { supabase } = locals
    const form = await request.formData()
    const id = parseInt(form.get('id') as string)

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' })

    const { error: deleteError } = await supabase.from('locale').delete().eq('id', id)

    if (deleteError) return fail(500, { error: deleteError.message })

    return { success: true }
  },
}
