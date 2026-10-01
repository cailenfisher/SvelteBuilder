import { redirect } from '@sveltejs/kit';
import { loadScopedCopy } from '$lib/server/scoped-copy';
import type { WarehouseShellView } from '@sveltebuilder/logistic/views';
import type { LayoutServerLoad } from './$types';

// The warehouse app's only gate: signed in. Unlike (admin) it does not require admin —
// picking, receiving and counting are the work of staff who are not administrators, and the
// module's worker RLS policies are written for exactly that. What a given worker may touch
// is decided by those policies, not here.
export const load: LayoutServerLoad = async ({ locals }): Promise<WarehouseShellView> => {
  if (locals.userAccountId === null) redirect(303, '/sign-in');

  // The shell's own copy lives in the module's scope, not the base seed's global scope: a
  // bare scaffold has no warehouse, so its nav labels are not application chrome every
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
