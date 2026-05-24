import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

type Locale = { id: number; code: string; name: string; nativeName: string; dir: string }

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id)
  if (isNaN(id)) throw error(404, 'Not found')

  return {
    locale: { id, code: '', name: '', nativeName: '', dir: 'ltr' } as Locale,
  }
}
