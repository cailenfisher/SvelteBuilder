import type { DictionaryPayload, Locale } from '@sveltebuilder/hermes'

declare global {
  namespace App {
    interface Locals {
      locale: Locale
      defaultLocale: Locale
    }
    interface PageData {
      dictionary: DictionaryPayload
      locale: Locale
      defaultLocale: Locale
      locales: Locale[]
    }
    interface Error {
      message: string
      code?: string
    }
  }
}

export {}
