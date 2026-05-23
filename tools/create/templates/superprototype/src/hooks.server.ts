import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { createSupabaseServerClient } from '$lib/server/supabase'
import { PUBLIC_DEFAULT_LOCALE } from '$env/static/public'

// This file overwrites templates/base/src/hooks.server.ts. It adds Supabase
// Auth wiring before the locale hook, which then reads available locales
// from the database via the Supabase client set in locals.

const supabaseHook: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.cookies)

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null }
    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) return { session: null, user: null }
    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    }
  })
}

const localeHook: Handle = async ({ event, resolve }) => {
  const defaultCode = PUBLIC_DEFAULT_LOCALE ?? 'en'

  const { data: locales } = await event.locals.supabase
    .from('locale')
    .select('id, code, name, native_name, dir')

  const available = locales ?? []

  const defaultLocale = available.find((l) => l.code === defaultCode)
    ?? available[0]
    ?? { id: 0, code: 'en', name: 'English', native_name: 'English', dir: 'ltr' }

  const cookieCode = event.cookies.get('locale')

  const headerCode = event.request.headers
    .get('accept-language')
    ?.split(',')[0]
    ?.split(';')[0]
    ?.trim()

  const resolvedCode = cookieCode ?? headerCode ?? defaultCode

  const resolvedLocale = available.find((l) => l.code === resolvedCode)
    ?? defaultLocale

  event.locals.locale = {
    id: resolvedLocale.id,
    code: resolvedLocale.code,
    name: resolvedLocale.name,
    nativeName: resolvedLocale.native_name,
    dir: resolvedLocale.dir as 'ltr' | 'rtl'
  }

  event.locals.defaultLocale = {
    id: defaultLocale.id,
    code: defaultLocale.code,
    name: defaultLocale.name,
    nativeName: defaultLocale.native_name,
    dir: defaultLocale.dir as 'ltr' | 'rtl'
  }

  return resolve(event)
}

export const handle = sequence(supabaseHook, localeHook)
