import type { Handle } from '@sveltejs/kit'
import { PUBLIC_DEFAULT_LOCALE } from '$env/static/public'

// Scaffold template (`hooks.server.ts` from the chosen template) overwrites
// this file and adds auth wiring before locale resolution. This base version
// resolves locale from cookie / Accept-Language header only — no database call.

export const handle: Handle = async ({ event, resolve }) => {
  const defaultCode = PUBLIC_DEFAULT_LOCALE ?? 'en'

  const cookieCode = event.cookies.get('locale')

  const headerCode = event.request.headers
    .get('accept-language')
    ?.split(',')[0]
    ?.split(';')[0]
    ?.trim()

  const resolvedCode = cookieCode ?? headerCode ?? defaultCode

  event.locals.locale = {
    id: 0,
    code: resolvedCode,
    name: resolvedCode,
    nativeName: resolvedCode,
    dir: 'ltr'
  }

  event.locals.defaultLocale = {
    id: 0,
    code: defaultCode,
    name: defaultCode,
    nativeName: defaultCode,
    dir: 'ltr'
  }

  return resolve(event)
}
