import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSuppliers } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const supabase = locals.supabase;
  const { locale } = locals;

  const suppliers = await getSuppliers(supabase, locale.code);

  return { suppliers, locale };
};
