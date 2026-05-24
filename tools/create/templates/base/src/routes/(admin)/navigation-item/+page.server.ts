import type { PageServerLoad } from './$types'

type NavItem = {
  id: number
  href: string
  scope: string
  sort_order: number
  active: boolean
  local_text_link: { id: number; slug: string; scope: string | null } | null
}

export const load: PageServerLoad = async () => {
  return {
    navItems: [] as NavItem[],
  }
}
