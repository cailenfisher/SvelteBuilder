import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async () => {
  return {
    navItems: [] as Array<{
      id: number
      href: string
      local_text_link: { slug: string; scope: string | null } | null
    }>,
  }
}
