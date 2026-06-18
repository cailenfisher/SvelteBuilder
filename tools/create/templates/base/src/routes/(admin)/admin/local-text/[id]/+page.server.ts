import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

type LocalTextLink = { id: number; slug: string; scope: string | null; entity_id: number | null }
type LocalText = { id: number; link: number; locale: number; content: string }
type Locale = { id: number; code: string; nativeName: string }

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id)
  if (isNaN(id)) throw error(404, 'Not found')

  return {
    entry: { id, slug: '', scope: null, entity_id: null } as LocalTextLink,
    translations: [] as LocalText[],
    locales: [] as Locale[],
  }
}
