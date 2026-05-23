import type { RequestHandler } from './$types';
import { getPublishedPosts, getBlogSitemapEntries } from '@sveltebuilder/blog/server';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;
  const supabase = locals.supabase;

  const { posts } = await getPublishedPosts(supabase, locale.code, {
    perPage: 1000,
    fallbackLocale: defaultLocale.code,
  });

  const entries = getBlogSitemapEntries(posts, {
    siteUrl: url.origin,
    locale: locale.code,
  });

  const items = entries
    .map(
      (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
