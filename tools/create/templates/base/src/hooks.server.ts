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

  // The cookie and header are caller-controlled, and the code ends up in markup (the
  // lang attribute below), so anything that is not shaped like a BCP-47 tag is ignored.
  const resolvedCode = [cookieCode, headerCode].find(isLanguageTag) ?? defaultCode

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

  // app.html declares <html lang="%sveltekit.lang%">, which is not a placeholder SvelteKit
  // fills on its own; without this every page ships that literal string as its language,
  // failing WCAG 3.1.1.
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%sveltekit.lang%', resolvedCode)
  })
}

function isLanguageTag(code: string | undefined): code is string {
  return code !== undefined && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code)
}
