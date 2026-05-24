import { redirect, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

// Redirect already-authenticated users away from the sign-in page.
export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (session) throw redirect(303, '/admin/dashboard')
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.' })
    }

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Return a generic message — do not expose whether the email exists.
      return fail(400, { error: 'Invalid email or password.' })
    }

    throw redirect(303, '/admin/dashboard')
  },
}
