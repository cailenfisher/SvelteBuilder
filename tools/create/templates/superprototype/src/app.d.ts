import type { SupabaseClient } from '@supabase/supabase-js';
import type { DictionaryPayload, Locale } from '@sveltebuilder/hermes';
import type { UserScopedDb } from '$lib/server/db/with-user';

declare global {
  namespace App {
    interface Locals {
      // Provider-specific: Supabase SSR client for auth flows (sign-in/out/callback).
      // Route code should use event.locals.db.withUser(...) for data queries —
      // supabase is only for Auth.js-equivalent operations in SuperPrototype.
      supabase: SupabaseClient;
      // Domain principal ID (public.user_account.id). Null when unauthenticated.
      userAccountId: bigint | null;
      // Transaction-scoped DB access. Only path for route code to query the database.
      db: UserScopedDb;
      locale: Locale;
      defaultLocale: Locale;
    }
    interface PageData {
      dictionary: DictionaryPayload;
      locale: Locale;
      defaultLocale: Locale;
      locales: Locale[];
    }
    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
