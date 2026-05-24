import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // Replace these stubs with real queries using locals.supabase
  // e.g. const { count } = await locals.supabase.from('user_account').select('id', { count: 'exact', head: true })
  return {
    stats: {
      totalUsers: null as number | null,
      activeSessions: null as number | null,
      published: null as number | null,
      pendingReview: null as number | null,
    },
  }
}
