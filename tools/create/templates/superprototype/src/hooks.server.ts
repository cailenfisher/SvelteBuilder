import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { asc } from 'drizzle-orm';
import { PUBLIC_DEFAULT_LOCALE } from '$env/static/public';
import { db } from '$lib/server/db/client';
import { createUserScopedDb } from '$lib/server/db/with-user';
import { resolveAuthenticatedUserId } from '$lib/server/auth-resolver';
import { providerHandle } from '$lib/server/auth-handle';
import { locale as localeTable } from '@sveltebuilder/hermes-schema/schema';

// Translates the provider's user identity to a public.user_account.id bigint,
// then attaches userAccountId and db (the withUser wrapper) to locals.
// This hook is identical across SuperPrototype and Native — the only line that
// differs is inside resolveAuthenticatedUserId (imported from auth-resolver.ts).
const populateLocals: Handle = async ({ event, resolve }) => {
  const userAccountId = await resolveAuthenticatedUserId(event);
  event.locals.userAccountId = userAccountId;
  event.locals.db = createUserScopedDb(userAccountId);
  return resolve(event);
};

// Locale resolution reads from the database (public.locale is unrestricted) using
// the raw db client — a deliberate exception documented in db/client.ts.
const localeHook: Handle = async ({ event, resolve }) => {
  const defaultCode = PUBLIC_DEFAULT_LOCALE ?? 'en';

  // Locale table is world-readable (locale_public_read policy: using (true)).
  // Raw db is intentional here — no user context needed for this lookup.
  const rows = await db.select().from(localeTable).orderBy(asc(localeTable.code));
  const available = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    nativeName: r.nativeName,
    dir: r.dir as 'ltr' | 'rtl',
  }));

  const defaultLocale = available.find((l) => l.code === defaultCode)
    ?? available[0]
    ?? { id: 0, code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' as const };

  const cookieCode = event.cookies.get('locale');

  const headerCode = event.request.headers
    .get('accept-language')
    ?.split(',')[0]
    ?.split(';')[0]
    ?.trim();

  const resolvedCode = cookieCode ?? headerCode ?? defaultCode;

  event.locals.locale = available.find((l) => l.code === resolvedCode) ?? defaultLocale;
  event.locals.defaultLocale = defaultLocale;

  return resolve(event);
};

export const handle = sequence(providerHandle, populateLocals, localeHook);
