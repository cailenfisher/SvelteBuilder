import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  return {
    navItems: [] as Array<{
      id: number
      href: string
      localTextLink: { slug: string; scope: string | null } | null
    }>,
  }
}
