import type { RequestHandler } from './$types';
import {
  getPublishedArticles,
  getArticleSitemapEntries,
  generateStandardSitemap,
} from '@sveltebuilder/content/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;

  const articles = await getPublishedArticles(locals.supabase, locale.code, {
    fallbackLocale: defaultLocale.code,
    perPage: 1000,
  });

  const entries = getArticleSitemapEntries(articles.items, { siteUrl: url.origin });

  const xml = generateStandardSitemap(entries);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
