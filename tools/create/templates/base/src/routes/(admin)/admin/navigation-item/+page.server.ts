import type { PageServerLoad } from './$types'

// camelCase, per the snake_case → camelCase conversion happening once at the
// serialization boundary: the loader maps, nothing downstream sees snake_case.
type NavigationItem = {
  id: number
  href: string
  menu: string
  position: number
  active: boolean
  localTextLink: { id: number; slug: string; scope: string | null } | null
}

export const load: PageServerLoad = async () => {
  return {
    navigationItems: [] as NavigationItem[],
  }
}
