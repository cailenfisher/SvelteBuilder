import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

type NavItem = {
  id: number
  href: string
  scope: string
  sortOrder: number
  active: boolean
  localTextLink: { id: number; slug: string; scope: string | null } | null
}
type LocalText = { id: number; link: number; locale: number; content: string }
type Locale = { id: number; code: string; nativeName: string }

export const load: PageServerLoad = async ({ params }) => {
  const id = parseInt(params.id)
  if (isNaN(id)) throw error(404, 'Not found')

  return {
    navItem: {
      id,
      href: '',
      scope: '',
      sortOrder: 0,
      active: true,
      localTextLink: null,
    } as NavItem,
    translations: [] as LocalText[],
    locales: [] as Locale[],
  }
}
