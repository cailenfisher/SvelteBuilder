import { BASE_SLUGS, LOCALES } from '@sveltebuilder/local-text-schema/seed';
import type { DictionaryPayload, Locale } from 'diglossia';
import type { LayoutServerLoad } from './$types';

// The base chrome's root layout expects `dictionary`, `locale`, `defaultLocale` and
// `locales`, which SuperPrototype loads from Postgres. The harness builds them from the
// canonical seed instead — LOCALES and BASE_SLUGS are what `sveltebuilder sync:supabase`
// writes into every project's seed.sql — so it boots with no database and the global
// copy it shows is the copy a fresh scaffold shows.

const locales: Locale[] = LOCALES.map((seed, index) => ({ id: index + 1, ...seed }));

/** An exact code, else its language subtag (`fr-CA` → `fr`), else nothing. */
function findLocale(code: string): Locale | undefined {
  return (
    locales.find((locale) => locale.code === code) ??
    locales.find((locale) => locale.code === code.split('-')[0])
  );
}

/**
 * One entry per slug, in the active locale where the seed has it and the default
 * locale otherwise — the same resolution `get_dictionary` does in SQL. Only en and fr
 * carry copy in the base seed, so any other locale exercises the fallback path.
 */
function dictionaryFor(locale: Locale, defaultLocale: Locale): DictionaryPayload {
  return BASE_SLUGS.flatMap((seed, index) => {
    const localeCode = locale.code in seed.translations ? locale.code : defaultLocale.code;
    const content = seed.translations[localeCode];
    if (content === undefined) return [];
    return [
      {
        link: { id: index + 1, slug: seed.slug, scope: null, entityId: null },
        content,
        localeCode,
      },
    ];
  });
}

export const load: LayoutServerLoad = ({ locals }) => {
  const defaultLocale = findLocale(locals.defaultLocale.code) ?? locales[0];
  const locale = findLocale(locals.locale.code) ?? defaultLocale;

  return {
    locale,
    defaultLocale,
    locales,
    dictionary: dictionaryFor(locale, defaultLocale),
  };
};
