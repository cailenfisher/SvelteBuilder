import { LOCALES } from '@sveltebuilder/local-text-schema/seed';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// The base chrome's LocaleSwitcher posts here. The base template ships no locale endpoint
// (SuperPrototype's validates the code against Postgres), so this is the one piece of
// locale plumbing the harness owns. It keeps SuperPrototype's contract: a `code` form
// field, the `locale` cookie, and a 303 back to the referring page.
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const formData = await request.formData();
  const code = formData.get('code');
  const known = typeof code === 'string' && LOCALES.some((locale) => locale.code === code);

  cookies.set('locale', known ? code : locals.defaultLocale.code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
  });

  redirect(303, request.headers.get('referer') ?? '/');
};
