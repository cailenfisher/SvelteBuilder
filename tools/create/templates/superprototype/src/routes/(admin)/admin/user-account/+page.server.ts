import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { UserAccountAdminListView } from '@sveltebuilder/access/views';
import { listUserAccount } from '$lib/server/user-account';
import { loadScopedCopy } from '$lib/server/scoped-copy';

export const load: PageServerLoad = async ({ locals }): Promise<UserAccountAdminListView> => {
  const [userAccountsResult, copy] = await Promise.all([
    listUserAccount(locals.supabase),
    loadScopedCopy(locals.supabase, ['access'], locals.locale.code, locals.defaultLocale.code),
  ]);
  if (userAccountsResult.error) throw error(500, 'Failed to load users.');

  return { userAccounts: userAccountsResult.data, copy };
};
