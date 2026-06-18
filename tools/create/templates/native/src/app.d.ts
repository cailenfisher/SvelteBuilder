// @auth/sveltekit augments App.Locals with `auth(): Promise<Session | null>`.
// Importing the package's types here makes that augmentation available project-wide.
import '@auth/sveltekit';

import type { DictionaryPayload, Locale } from '@sveltebuilder/hermes';
import type { UserScopedDb } from '$lib/server/db/with-user';

declare global {
  namespace App {
    interface Locals {
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
