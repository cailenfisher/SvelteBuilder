import { redirect } from '@sveltejs/kit';
import { PUBLIC_SITE_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.userAccountId) throw redirect(303, '/admin/dashboard');
  return {};
};

export const actions: Actions = {
  default: async ({ locals }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error || !data.url) {
      return formError(500, 'error.sign_in_failed');
    }

    throw redirect(303, data.url);
  },
};
