// SuperPrototype auth resolver — resolves the Supabase session to a
// public.user_account.id (bigint domain principal). This is the single seam
// that differs between SuperPrototype and Native.
//
// Deliberate db import: this is the pre-auth bootstrap lookup that runs before
// any user context exists, so it cannot go through withUser.

import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { userAccount } from '$lib/server/schema';

export async function resolveAuthenticatedUserId(
  event: RequestEvent,
): Promise<bigint | null> {
  const { data: { user }, error } = await event.locals.supabase.auth.getUser();
  if (error || !user) return null;

  const rows = await db
    .select({ id: userAccount.id })
    .from(userAccount)
    .where(eq(userAccount.authUserId, user.id))
    .limit(1);

  return rows[0]?.id ?? null;
}
