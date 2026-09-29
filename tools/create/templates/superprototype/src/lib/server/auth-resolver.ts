// SuperPrototype auth resolver — resolves the Supabase session to a
// public.user_account.id (bigint domain principal). This is the single seam
// that differs between SuperPrototype and Native.
//
// Deliberate db import: this is the pre-auth bootstrap lookup that runs before
// any user context exists, so it cannot go through withUser.
//
// First sign-in for a given Supabase auth identity provisions the domain
// principal row (Native's parallel to this is events.createUser). The very
// first user_account ever created is granted admin — there is no other seam
// to reach the admin area from a freshly seeded database, hosted or local.
// Revoke it (or promote someone else) with a direct SQL update once you have
// a real admin.

import type { RequestEvent } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { userAccount } from '$lib/server/schema';

export async function resolveAuthenticatedUserId(
  event: RequestEvent,
): Promise<bigint | null> {
  const { data: { user }, error } = await event.locals.supabase.auth.getUser();
  if (error || !user) return null;

  const existing = await db
    .select({ id: userAccount.id })
    .from(userAccount)
    .where(eq(userAccount.authUserId, user.id))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [{ value: userAccountCount }] = await db.select({ value: count() }).from(userAccount);

  const [created] = await db
    .insert(userAccount)
    .values({ authUserId: user.id, admin: userAccountCount === 0 })
    .onConflictDoNothing({ target: userAccount.authUserId })
    .returning({ id: userAccount.id });

  if (created) return created.id;

  // Lost a race with a concurrent request provisioning the same identity.
  const retry = await db
    .select({ id: userAccount.id })
    .from(userAccount)
    .where(eq(userAccount.authUserId, user.id))
    .limit(1);

  return retry[0]?.id ?? null;
}
