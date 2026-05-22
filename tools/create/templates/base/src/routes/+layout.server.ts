import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
  const { locale, defaultLocale } = locals

  const [dictionaryResponse, localesResponse] = await Promise.all([
    fetch(`/api/local-text/${locale.code}`),
    fetch('/api/locale')
  ])

  const dictionary = await dictionaryResponse.json()
  const locales = await localesResponse.json()

  const { session, user } = await locals.safeGetSession()

  return {
    locale,
    defaultLocale,
    dictionary,
    locales,
    session,
    user
  }
}
