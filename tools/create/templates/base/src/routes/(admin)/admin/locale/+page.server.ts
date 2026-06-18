import type { PageServerLoad } from './$types'

type Locale = { id: number; code: string; name: string; nativeName: string; dir: string }

export const load: PageServerLoad = async () => {
  return {
    locales: [] as Locale[],
  }
}
