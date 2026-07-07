import type { ArticleWithCopy } from '../schema/index.js';

// XML escape — handles all five predefined XML entities correctly.
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// RFC 822 date format required by RSS 2.0.
// Must use UTC offset not a timezone name (not "UTC" — use "+0000").
function toRfc822(iso: string): string {
  return new Date(iso).toUTCString().replace('GMT', '+0000');
}

export function generateRssFeed(
  articles: ArticleWithCopy[],
  options: {
    siteUrl: string;
    locale: string;
    feedTitle: string;
    feedDescription: string;
    feedPath?: string;
  },
): string {
  const { siteUrl, locale, feedTitle, feedDescription } = options;
  const base = siteUrl.replace(/\/$/, '');
  const feedPath = options.feedPath ?? '/rss.xml';
  const lastBuild = articles.length > 0
    ? toRfc822(articles[0].publishedAt ?? articles[0].createdAt)
    : toRfc822(new Date().toISOString());

  const items = articles
    .filter((a) => a.publishedAt)
    .map((a) => {
      // Use canonical_slug (URL-safe) — NOT title (which may contain unsafe characters).
      const link = `${base}/article/${a.canonicalSlug}`;
      const pubDate = toRfc822(a.publishedAt!);
      const bylineText = a.bylines.map((b) => b.name).join(', ');

      return `  <item>
    <title>${xmlEscape(a.headline)}</title>
    <link>${xmlEscape(link)}</link>
    <description>${xmlEscape(a.dek)}</description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="true">${xmlEscape(link)}</guid>${bylineText ? `\n    <author>${xmlEscape(bylineText)}</author>` : ''}${a.sections[0] ? `\n    <category>${xmlEscape(a.sections[0].name)}</category>` : ''}
  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(feedTitle)}</title>
    <link>${xmlEscape(base)}</link>
    <description>${xmlEscape(feedDescription)}</description>
    <language>${xmlEscape(locale)}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${xmlEscape(`${base}${feedPath}`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
