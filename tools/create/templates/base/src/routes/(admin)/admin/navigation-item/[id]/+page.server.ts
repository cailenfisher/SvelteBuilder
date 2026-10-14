import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

type NavigationItem = {
  id: number
  href: string
  menu: string
  position: number
  active: boolean
  localTextLink: { id: number; slug: string; scope: string | null } | null
}
type LocalText = { id: number; link: number; locale: number; content: string }
type Locale = { id: number; code: string; nativeName: string }

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id)
  if (isNaN(id)) throw error(404, 'Not found')

  return {
    navigationItem: {
      id,
      href: '',
      menu: '',
      position: 0,
      active: true,
      localTextLink: null,
    } as NavigationItem,
    translations: [] as LocalText[],
    locales: [] as Locale[],
  }
}
