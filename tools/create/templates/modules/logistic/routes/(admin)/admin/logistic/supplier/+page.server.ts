import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSuppliers } from '@sveltebuilder/logistic/server';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.userAccountId === null) throw redirect(303, '/sign-in');
  const { locale } = locals;

  const suppliers = await locals.db.withUser((tx) => getSuppliers(tx, locale.code));

  return { suppliers, locale };
};
