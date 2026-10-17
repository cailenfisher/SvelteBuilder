import type { SupabaseClient } from '@supabase/supabase-js';
import type { ArticleRow } from '@sveltebuilder/content/views';
import {
  toOne,
  type CountedRows,
  type QueryRange,
  type QueryResult,
} from '$lib/server/postgrest';
import { toArticleBlocks, toArticleRow } from './article';

/**
 * The articles filed in a section, newest first, each with only its image blocks: a card needs
 * the first picture, not the body. The filter narrows the embedded rows and leaves every article
 * in the page.
 *
 * Reached through the join table rather than filtered on the article table, because an article
 * can be filed in several sections. `!inner` on the embed means an article RLS hides drops its
 * join row too, so an unpublished article never appears here as a null.
 */
export async function listArticleBySection(
  supabase: SupabaseClient,
  sectionId: number,
  range: QueryRange
): Promise<QueryResult<CountedRows<ArticleRow>>> {
  const { data, error, count } = await supabase
    .from('article_section')
    .select(
      'article!inner(id, article_status_id, canonical_slug, published_at, updated_at, deleted_at, embargo_expires_at, comment_allowed, lead_media_asset_id, created_at, article_status!inner(id, slug, position), article_block(id, article_id, block_type, position, content, media_asset_id, created_at), article_byline(position, author_profile(id, user_account_id, slug, active, created_at)), article_section(section(id, parent_section_id, slug, position, active, created_at)), article_topic(topic(id, slug, active, created_at)), article_tag(tag(id, slug, active, created_at)))',
      { count: 'exact' }
    )
    .eq('section_id', sectionId)
    .eq('article.article_block.block_type', 'image')
    .order('published_at', { ascending: false, referencedTable: 'article' })
    .range(range.offset, range.offset + range.limit - 1);
  if (error) return { data: null, error };

  const articles: ArticleRow[] = [];
  for (const link of data) {
    const row = toOne(link.article);
    if (row === null) continue;
    const article = toArticleRow(row);
    if (article === null) continue;
    articles.push({ ...article, blocks: toArticleBlocks(row.article_block) });
  }
  return { data: { rows: articles, total: count ?? articles.length }, error: null };
}
