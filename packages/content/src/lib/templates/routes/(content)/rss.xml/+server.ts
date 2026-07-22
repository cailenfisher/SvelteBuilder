import type { RequestHandler } from './$types';
import { getPublishedArticles, generateRssFeed } from '@sveltebuilder/content/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;

  const articles = await getPublishedArticles(locals.supabase, {
    locale: locale.code,
    defaultLocale: defaultLocale.code,
    page: 1,
    perPage: 50,
  });

  const xml = generateRssFeed(articles.items, {
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
