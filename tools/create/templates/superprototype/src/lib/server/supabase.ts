import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import type { Cookies } from '@sveltejs/kit'

export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookies.set(name, value, { ...options, path: '/' })
        )
      }
    }
  })
}

export function createSupabaseServiceClient() {
  return createServerClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
