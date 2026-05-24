import { redirect, fail } from '@sveltejs/kit'
import { PUBLIC_SITE_URL } from '$env/static/public'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (session) throw redirect(303, '/admin/dashboard')
  return {}
}

export const actions: Actions = {
  default: async ({ locals }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error || !data.url) {
      return fail(500, { error: 'Could not initiate Google sign-in.' })
    }

    throw redirect(303, data.url)
  },
}
