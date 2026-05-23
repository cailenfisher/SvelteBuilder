import type { PostWithCopy } from '../schema/index.js';

export function getBlogSitemapEntries(
  posts: PostWithCopy[],
  options: {
    siteUrl: string;
    locale: string;
  },
): Array<{ url: string; lastmod: string; changefreq: string; priority: string }> {
  const baseUrl = options.siteUrl.replace(/\/$/, '');

  return posts.map((post) => {
    const slug = encodeURIComponent(post.title);
    const lastmod = post.updatedAt.split('T')[0];
    const priority = post.featured ? '0.9' : '0.7';

    return {
      url: `${baseUrl}/blog/${slug}`,
      lastmod,
      changefreq: 'weekly',
      priority,
    };
  });
}
