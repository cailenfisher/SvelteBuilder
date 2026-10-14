import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // Replace these stubs with calls to the tables' data modules in $lib/server, passing
  // locals.supabase: e.g. a countUserAccount(locals.supabase) in $lib/server/user-account.ts
  return {
    stats: {
      totalUsers: null as number | null,
      activeSessions: null as number | null,
      published: null as number | null,
      pendingReview: null as number | null,
    },
  }
}
