import { redirect } from '@sveltejs/kit';
import { signIn } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.userAccountId) throw redirect(303, '/admin/dashboard');
  return {};
};

export const actions: Actions = {
  google: async (event) => {
    await signIn('google', event);
  },
  github: async (event) => {
    await signIn('github', event);
  },
  entra: async (event) => {
    await signIn('microsoft-entra-id', event);
  },
};
