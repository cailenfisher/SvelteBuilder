import type { PageServerLoad } from './$types'

// camelCase, per the snake_case → camelCase conversion happening once at the
// serialization boundary: the loader maps, nothing downstream sees snake_case.
type NavItem = {
  id: number
  href: string
  scope: string
  sortOrder: number
  active: boolean
  localTextLink: { id: number; slug: string; scope: string | null } | null
}

export const load: PageServerLoad = async () => {
  return {
    navItems: [] as NavItem[],
  }
}
