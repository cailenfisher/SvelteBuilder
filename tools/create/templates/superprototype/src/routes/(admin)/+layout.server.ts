import { redirect } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { navigationItem } from '$lib/server/schema';
import { localTextLink } from '@sveltebuilder/hermes-schema/schema';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.userAccountId) throw redirect(303, '/sign-in');

  // Fetch the Supabase auth user for display in the admin header. This is the
  // one place the provider client is used in a load function — to surface the
  // email that lives in auth.user rather than user_account.
  const { data: { user } } = await locals.supabase.auth.getUser();

  const navItems = await locals.db.withUser(async (tx) => {
    return tx
      .select({
        id: navigationItem.id,
        href: navigationItem.href,
        localTextLink: {
          slug: localTextLink.slug,
          scope: localTextLink.scope,
        },
      })
      .from(navigationItem)
      .leftJoin(localTextLink, eq(navigationItem.localTextLinkId, localTextLink.id))
      .where(and(eq(navigationItem.scope, 'admin'), eq(navigationItem.active, true)))
      .orderBy(asc(navigationItem.sortOrder));
  });

  return {
    navItems,
    user,
  };
};
