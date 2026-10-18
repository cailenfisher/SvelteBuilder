import { error, redirect } from '@sveltejs/kit';
import { listCurrentUserScope } from '$lib/server/permission';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { WarehouseShellView } from '@sveltebuilder/logistic/views';
import type { LayoutServerLoad } from './$types';

// The warehouse floor: for anyone holding a role on its work, picking, receiving or counting
// (A22). Signing in is not enough, since Supabase signs up anyone with an email address. What a
// worker may do once here is decided by the permissions each function checks, not by this.
const WAREHOUSE_SCOPES = ['pick_task', 'inbound_receipt', 'cycle_count'];

export const load: LayoutServerLoad = async ({ locals }): Promise<WarehouseShellView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  const { data: scopes, error: scopeError } = await listCurrentUserScope(locals.supabase);
  if (scopeError) throw error(500, 'Failed to verify warehouse access.');
  if (!scopes.some((scope) => WAREHOUSE_SCOPES.includes(scope))) {
    throw error(403, 'The warehouse is for staff with a warehouse role.');
  }

  // The shell's own copy lives in the module's scope, not the base seed's global scope: a
  // bare scaffold has no warehouse, so its navigation labels are not application chrome every
  // project carries. Page data inherits this, which is how the home screen — which has no
  // loader of its own — gets its labels.
  return {
    copy: await loadScopedCopy(
      locals.supabase,
      ['logistic'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  };
};
