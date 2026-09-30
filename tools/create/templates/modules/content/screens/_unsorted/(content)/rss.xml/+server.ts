import type { RequestHandler } from './$types';
import { createDictionary } from 'diglossia';
import {
  getPublishedArticles,
  buildArticleListDictionaryPayload,
  generateRssFeed,
} from '@sveltebuilder/content/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;

  const articles = await getPublishedArticles(locals.supabase, locale.code, {
    fallbackLocale: defaultLocale.code,
    page: 1,
    perPage: 50,
  });

  const dictionary = createDictionary(
    buildArticleListDictionaryPayload(articles.items, locale.code),
  );

  const xml = generateRssFeed(articles.items, dictionary, {
    siteUrl: url.origin,
    locale: locale.code,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
};
