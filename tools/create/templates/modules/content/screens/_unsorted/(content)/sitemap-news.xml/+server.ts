import type { RequestHandler } from './$types';
import { createDictionary } from 'diglossia';
import {
  getPublishedArticles,
  getPublisherProfile,
  buildArticleListDictionaryPayload,
  generateNewsSitemap,
} from '@sveltebuilder/content/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;

  const [articles, publisher] = await Promise.all([
    getPublishedArticles(locals.supabase, locale.code, {
      fallbackLocale: defaultLocale.code,
      perPage: 1000,
    }),
    getPublisherProfile(locals.supabase, locale.code, defaultLocale.code),
  ]);

  const dictionary = createDictionary(
    buildArticleListDictionaryPayload(articles.items, locale.code),
  );

  const xml = generateNewsSitemap(articles.items, dictionary, {
    siteUrl: url.origin,
    locale: locale.code,
    publicationName: publisher?.name ?? '',
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
