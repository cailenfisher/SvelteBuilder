import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { listMenuNavigationItem } from '$lib/server/navigation-item';
import { listCurrentUserScope } from '$lib/server/permission';
import { getUserAccountAdmin } from '$lib/server/user-account';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.userAccountId) throw redirect(303, '/sign-in');

  // Authentication is not authorization. The admin area admits administrators and staff: anyone
  // holding at least one role, broadly or on a single item (A24). Everyone else is told no here
  // rather than reaching a half-populated UI. RLS refuses their reads and writes regardless; this
  // is the experience, not the guard. Each administrator-only screen checks `admin` in its own
  // loader, through parent(). user_account_owner_read is what lets a caller read their own row.
  const [{ data: account, error: accountError }, { data: scopes, error: scopeError }] = await Promise.all([
    getUserAccountAdmin(locals.supabase, locals.userAccountId),
    listCurrentUserScope(locals.supabase),
  ]);

  if (accountError || scopeError) throw error(500, 'Failed to verify admin access.');
  const admin = account?.admin ?? false;
  if (!admin && scopes.length === 0) throw error(403, 'Admin access required.');

  // getUser() rather than getClaims() here on purpose: this reads the live
  // auth.users record for the operator's email, which belongs to the identity
  // layer and is not something a cached token payload should be trusted for.
  const { data: { user } } = await locals.supabase.auth.getUser();

  const { data: navigationItems, error: queryError } = await listMenuNavigationItem(
    locals.supabase,
    'admin'
  );

  if (queryError) throw error(500, 'Failed to load admin navigation.');

  // An administrator sees every entry. Staff see the entries for scopes they hold anything in;
  // an entry naming no scope is for administrators only.
  const visibleNavigationItems = admin
    ? navigationItems
    : navigationItems.filter(
        (item) => item.permissionScope !== null && scopes.includes(item.permissionScope)
      );

  return { navigationItems: visibleNavigationItems, user, admin, scopes };
};
