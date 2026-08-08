import type { RequestHandler } from './$types';
import { getArticleSitemapEntries, generateNewsSitemap } from '@sveltebuilder/content/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;

  const entries = await getArticleSitemapEntries(locals.supabase, {
    locale: locale.code,
    defaultLocale: defaultLocale.code,
    newsOnly: true,
  });

  const xml = generateNewsSitemap(entries, {
    siteUrl: url.origin,
    locale: locale.code,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
