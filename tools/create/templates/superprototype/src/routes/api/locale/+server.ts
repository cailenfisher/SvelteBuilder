import { json, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { Locale } from '@sveltebuilder/hermes';
import { db } from '$lib/server/db/client';
import { locale as localeTable } from '@sveltebuilder/hermes-schema/schema';

// Locale data is world-readable — no RLS restriction — so the raw db client is
// used directly (a deliberate exception; see db/client.ts for the rule).

export const GET: RequestHandler = async () => {
  const rows = await db
    .select({
      id: localeTable.id,
      code: localeTable.code,
      name: localeTable.name,
      nativeName: localeTable.nativeName,
      dir: localeTable.dir,
    })
    .from(localeTable)
    .orderBy(asc(localeTable.name));

  const locales: Locale[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    nativeName: r.nativeName,
    dir: r.dir as 'ltr' | 'rtl',
  }));

  return json(locales);
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const formData = await request.formData();
  const code = formData.get('code');

  if (!code || typeof code !== 'string') {
    return json({ error: 'Invalid locale code' }, { status: 400 });
  }

  const rows = await db
    .select({ code: localeTable.code })
    .from(localeTable)
    .where(eq(localeTable.code, code))
    .limit(1);

  const resolvedCode = rows[0]?.code ?? locals.defaultLocale.code;

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
