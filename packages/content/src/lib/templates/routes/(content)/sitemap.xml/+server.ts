import type { RequestHandler } from './$types';
import { getArticleSitemapEntries, generateStandardSitemap } from '@sveltebuilder/content/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;

  const entries = await getArticleSitemapEntries(locals.supabase, {
    locale: locale.code,
    defaultLocale: defaultLocale.code,
    newsOnly: false,
  });

  const xml = generateStandardSitemap(entries, { siteUrl: url.origin });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
