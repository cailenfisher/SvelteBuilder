// Native auth resolver — resolves the Auth.js session to a
// public.user_account.id (bigint domain principal). This is the single seam
// that differs between Native and SuperPrototype.
//
// Deliberate db import: this is the pre-auth bootstrap lookup that runs before
// any user context exists, so it cannot go through withUser.
//
// event.locals.auth() is set by the Auth.js handle hook (from SvelteKitAuth in
// auth.ts) and returns the current session. The user.id in the session is the
// auth.user.id text value, which we map to user_account.id bigint.

import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { userAccount } from '$lib/server/schema';

export async function resolveAuthenticatedUserId(
  event: RequestEvent,
): Promise<bigint | null> {
  const session = await event.locals.auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select({ id: userAccount.id })
    .from(userAccount)
    .where(eq(userAccount.authUserId, session.user.id))
    .limit(1);

  return rows[0]?.id ?? null;
}
