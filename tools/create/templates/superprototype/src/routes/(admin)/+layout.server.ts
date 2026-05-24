import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

// Every route inside (admin) requires an active session.
// If the user is not authenticated, redirect to the sign-in page.
export const load: LayoutServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (!session) throw redirect(303, '/sign-in')
  return {}
}
