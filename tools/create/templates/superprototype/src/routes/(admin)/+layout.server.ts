import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { listMenuNavigationItem } from '$lib/server/navigation-item';
import { getUserAccountAdmin } from '$lib/server/user-account';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.userAccountId) throw redirect(303, '/sign-in');

  // Authentication is not authorization. RLS already refuses a non-admin's reads
  // and writes, but without this check they would reach the admin UI and see it
  // half-populated instead of being told no. user_account_owner_read is what lets
  // a caller read their own row here.
  const { data: account, error: accountError } = await getUserAccountAdmin(
    locals.supabase,
    locals.userAccountId
  );

  if (accountError) throw error(500, 'Failed to verify admin access.');
  if (!account?.admin) throw error(403, 'Admin access required.');

  // getUser() rather than getClaims() here on purpose: this reads the live
  // auth.users record for the operator's email, which belongs to the identity
  // layer and is not something a cached token payload should be trusted for.
  const { data: { user } } = await locals.supabase.auth.getUser();

  const { data: navItems, error: queryError } = await listMenuNavigationItem(
    locals.supabase,
    'admin'
  );

  if (queryError) throw error(500, 'Failed to load admin navigation.');

  return { navItems, user };
};
