import type { ArticleWithCopy } from '../schema/index.js';

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ISO 8601 date (YYYY-MM-DD) required by sitemaps.
function toSitemapDate(iso: string): string {
  return iso.split('T')[0];
}

export type SitemapEntry = {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
};

// Standard sitemap — all published articles.
export function getArticleSitemapEntries(
  articles: ArticleWithCopy[],
  options: { siteUrl: string },
): SitemapEntry[] {
  const base = options.siteUrl.replace(/\/$/, '');
  return articles.map((a) => ({
    url: `${base}/article/${a.canonicalSlug}`,
    lastmod: toSitemapDate(a.updatedAt),
    changefreq: 'weekly',
    priority: '0.8',
  }));
}

// News sitemap — pruned to 48-hour window, max 1,000 URLs.
// Requires: publication name, language (BCP-47), title, publication date.
// Dates must include timezone offset (ISO 8601 with offset, not UTC-naïve).
export function generateNewsSitemap(
  articles: ArticleWithCopy[],
  options: {
    siteUrl: string;
    locale: string;
    publicationName: string;
  },
): string {
  const base = options.siteUrl.replace(/\/$/, '');
  const now = Date.now();
  const cutoff = now - 48 * 60 * 60 * 1000;

  const recent = articles
    .filter((a) => a.publishedAt && new Date(a.publishedAt).getTime() >= cutoff)
    .slice(0, 1000);

  const entries = recent.map((a) => {
    const link = `${base}/article/${a.canonicalSlug}`;
    // Use full ISO 8601 with offset — required for Google News structured data.
    const pubDate = new Date(a.publishedAt!).toISOString();

    return `  <url>
    <loc>${xmlEscape(link)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(options.publicationName)}</news:name>
        <news:language>${xmlEscape(options.locale)}</news:language>
      </news:publication>
      <news:publication_date>${xmlEscape(pubDate)}</news:publication_date>
      <news:title>${xmlEscape(a.headline)}</news:title>
    </news:news>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join('\n')}
</urlset>`;
}

export function generateStandardSitemap(entries: SitemapEntry[]): string {
  const urlEls = entries
    .map(
      (e) => `  <url>
    <loc>${xmlEscape(e.url)}</loc>
    <lastmod>${xmlEscape(e.lastmod)}</lastmod>
    <changefreq>${xmlEscape(e.changefreq)}</changefreq>
    <priority>${xmlEscape(e.priority)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEls}
</urlset>`;
}
