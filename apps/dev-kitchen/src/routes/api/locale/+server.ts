import { json, redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { Locale } from '@sveltebuilder/hermes'

export const GET: RequestHandler = async ({ locals }) => {
  const { data, error } = await locals.supabase
    .from('locale')
    .select('id, code, name, native_name, dir')
    .order('name', { ascending: true })

  if (error) {
    console.error('[locale] failed to load available locales:', error)
    return json([] satisfies Locale[], { status: 200 })
  }

  const locales: Locale[] = (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    nativeName: row.native_name,
    dir: row.dir as 'ltr' | 'rtl'
  }))

  return json(locales)
}

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const formData = await request.formData()
  const code = formData.get('code')

  if (!code || typeof code !== 'string') {
    return json({ error: 'Invalid locale code' }, { status: 400 })
  }

  // Validate the code exists in the database
  const { data } = await locals.supabase
    .from('locale')
    .select('code')
    .eq('code', code)
    .single()

  // Silently fall back — do not expose whether the code exists or not
  const resolvedCode = data?.code ?? locals.defaultLocale.code

  cookies.set('locale', resolvedCode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: true,
    secure: true
  })

  // Redirect back to the referring page, fall back to home
  const referer = request.headers.get('referer') ?? '/'
  redirect(303, referer)
}
