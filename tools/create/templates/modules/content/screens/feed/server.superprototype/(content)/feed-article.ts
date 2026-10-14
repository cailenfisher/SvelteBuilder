// Shared by the three feed endpoints in this bundle.
//
// Colocated in the routes tree rather than in $lib, because it belongs to these three routes
// and nothing else. SvelteKit only treats `+page`, `+layout`, `+server` and `+error` as
// special, so an ordinary module here is simply not a route — which is the idiomatic place for
// code three sibling routes share. The queries themselves are the content data module's.
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { listLatestArticle } from '$lib/server/content/article';
import { getPublisherProfile } from '$lib/server/content/publisher-profile';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DictionaryPayload } from 'diglossia';
import type { ArticleRow } from '@sveltebuilder/content/views';
import type { PublisherProfile } from '@sveltebuilder/content';

/**
 * The most recently published articles, newest first, with the copy needed to render them.
 *
 * These endpoints are read by crawlers with no session at all, so they run as `anon` and see
 * exactly what a reader would — which is the property worth having, since a feed that leaked
 * an embargoed story would leak it to Google first.
 */
export async function loadFeedArticles(
  supabase: SupabaseClient,
  localeCode: string,
  fallbackCode: string,
  limit: number
): Promise<{
  articles: ArticleRow[];
  /** Null when none is seeded; a feed then has no title to give itself. */
  publisher: PublisherProfile | null;
  copy: DictionaryPayload;
}> {
  const [articlesResult, publisherResult] = await Promise.all([
    listLatestArticle(supabase, limit),
    // The feeds title themselves after the publication, so its identity is part of this.
    getPublisherProfile(supabase),
  ]);

  if (articlesResult.error) throw articlesResult.error;
  if (publisherResult.error) throw publisherResult.error;

  const articles = articlesResult.data;
  const publisher = publisherResult.data;

  const copy = await loadEntityCopy(
    supabase,
    [
      { scope: 'article', ids: articles.map((article) => article.id) },
      {
        scope: 'author_profile',
        ids: articles.flatMap((article) => article.bylines.map((author) => author.id)),
      },
      {
        scope: 'section',
        ids: articles.flatMap((article) => article.sections.map((entry) => entry.id)),
      },
      { scope: 'tag', ids: articles.flatMap((article) => article.tags.map((entry) => entry.id)) },
      { scope: 'publisher_profile', ids: publisher ? [publisher.id] : [] },
    ],
    localeCode,
    fallbackCode
  );

  // The feed's own description is application-level copy, not entity-bound, so it comes from
  // the module's scope rather than by id.
  const uiCopy = await loadScopedCopy(supabase, ['content'], localeCode, fallbackCode);

  return { articles, publisher, copy: [...uiCopy, ...copy] };
}
