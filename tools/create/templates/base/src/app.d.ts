import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import type { DictionaryPayload, Locale } from '@sveltebuilder/hermes'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      locale: Locale
      defaultLocale: Locale
    }
    interface PageData {
      dictionary: DictionaryPayload
      locale: Locale
      defaultLocale: Locale
      locales: Locale[]
      session: Session | null
      user: User | null
    }
    interface Error {
      message: string
      code?: string
    }
  }
}

export {}
