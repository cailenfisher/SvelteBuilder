import type { RequestHandler } from './$types';
import { getPublishedPosts, generateRssFeed } from '@sveltebuilder/blog/server';
import { localText } from '@sveltebuilder/hermes';

export const GET: RequestHandler = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;
  const supabase = locals.supabase;

  const { posts } = await getPublishedPosts(supabase, locale.code, {
    perPage: 20,
    fallbackLocale: defaultLocale.code,
  });

  const siteUrl = url.origin;
  const feedTitle = localText('blog.post.list.title', 'blog');
  const feedDescription = localText('app.tagline');

  const xml = generateRssFeed(posts, {
    siteUrl,
    locale: locale.code,
    feedTitle,
    feedDescription,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
