import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Locale } from 'diglossia';
import { getLocaleByCode, listLocale } from '$lib/server/locale';

// public.locale is world-readable (locale_public_read), so these run fine with no
// session on the publishable key.

export const GET: RequestHandler = async ({ locals }) => {
  const { data: locales, error } = await listLocale(locals.supabase, 'name');

  if (error) {
    console.error('[locale] query error:', error);
    return json([] satisfies Locale[], { status: 200 });
  }

  return json(locales);
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const formData = await request.formData();
  const code = formData.get('code');

  if (!code || typeof code !== 'string') {
    return json({ error: 'Invalid locale code' }, { status: 400 });
  }

  // An unknown code, or a failed lookup, falls back to the default locale rather than
  // refusing the switch; the failure is logged so it is not silent.
  const { data: locale, error } = await getLocaleByCode(locals.supabase, code);
  if (error) console.error('[locale] lookup error:', error);

  const resolvedCode = locale?.code ?? locals.defaultLocale.code;

  cookies.set('locale', resolvedCode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
  });

  const referer = request.headers.get('referer') ?? '/';
  redirect(303, referer);
};
