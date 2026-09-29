import type { PageServerLoad } from './$types'

type LocalTextLink = { id: number; slug: string; scope: string | null; entityId: number | null }
type LocalText = { id: number; link: number; locale: number; content: string }
type Locale = { id: number; code: string; nativeName: string }

export const load: PageServerLoad = async () => {
  return {
    entries: [] as LocalTextLink[],
    translations: [] as LocalText[],
    locales: [] as Locale[],
  }
}
