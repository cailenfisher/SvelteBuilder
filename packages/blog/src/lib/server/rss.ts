import type { PostWithCopy } from '../schema/index.js';

export function generateRssFeed(
  posts: PostWithCopy[],
  options: {
    siteUrl: string;
    locale: string;
    feedTitle: string;
    feedDescription: string;
  },
): string {
  const { siteUrl, locale, feedTitle, feedDescription } = options;
  const baseUrl = siteUrl.replace(/\/$/, '');
  const lastBuild = posts.length > 0
    ? new Date(posts[0].publishedAt ?? posts[0].createdAt).toUTCString()
    : new Date().toUTCString();

  function escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const items = posts
    .map((post) => {
      const slug = encodeURIComponent(post.title);
      const link = `${baseUrl}/blog/${slug}`;
      const pubDate = new Date(post.publishedAt ?? post.createdAt).toUTCString();

      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${escape(link)}</link>
      <description>${escape(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escape(link)}</guid>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(feedTitle)}</title>
    <link>${escape(baseUrl)}</link>
    <description>${escape(feedDescription)}</description>
    <language>${locale}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escape(`${baseUrl}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
