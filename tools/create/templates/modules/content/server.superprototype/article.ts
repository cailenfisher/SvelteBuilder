import type { SupabaseClient } from '@supabase/supabase-js';
import type { Article, ArticleBlock } from '@sveltebuilder/content';
import type { ArticleRow, ArticleWithBlocks } from '@sveltebuilder/content/views';
import {
  toOne,
  type CountedRows,
  type QueryRange,
  type QueryResult,
} from '$lib/server/postgrest';

// No published, embargo or deleted predicate anywhere in this file: RLS applies it. A reader
// sees exactly what the public policies admit, and an editor, whose admin policy is `for all`,
// sees every article at every status. The same query answers both, which is the point. See the
// module's supabase/supplemental/02-content-rls.sql.

/** An article with its status and relations, without its body. */
const selectArticleRow = (supabase: SupabaseClient, count?: 'exact') =>
  supabase
    .from('article')
    .select(
      'id, article_status_id, canonical_slug, published_at, updated_at, deleted_at, embargo_expires_at, comment_allowed, lead_media_asset_id, created_at, article_status!inner(id, slug, position), article_byline(position, author_profile(id, user_account_id, slug, active, created_at)), article_section(section(id, parent_section_id, slug, position, active, created_at)), article_topic(topic(id, slug, active, created_at)), article_tag(tag(id, slug, active, created_at))',
      { count }
    );

/** An article with its status, relations and every block of its body. */
const selectArticleWithBlocks = (supabase: SupabaseClient) =>
  supabase
    .from('article')
    .select(
      'id, article_status_id, canonical_slug, published_at, updated_at, deleted_at, embargo_expires_at, comment_allowed, lead_media_asset_id, created_at, article_status!inner(id, slug, position), article_block(id, article_id, block_type, position, content, media_asset_id, created_at), article_byline(position, author_profile(id, user_account_id, slug, active, created_at)), article_section(section(id, parent_section_id, slug, position, active, created_at)), article_topic(topic(id, slug, active, created_at)), article_tag(tag(id, slug, active, created_at))'
    );

type ArticleRecord = NonNullable<
  Awaited<ReturnType<typeof selectArticleRow>>['data']
>[number];

type ArticleBlockRecord = NonNullable<
  Awaited<ReturnType<typeof selectArticleWithBlocks>>['data']
>[number]['article_block'][number];

/** An article's blocks in `position` order. */
export const toArticleBlocks = (blocks: ArticleBlockRecord[] | null): ArticleBlock[] =>
  (blocks ?? [])
    .map((block) => ({
      id: block.id,
      articleId: block.article_id,
      blockType: block.block_type,
      position: block.position,
      content: block.content,
      mediaAssetId: block.media_asset_id,
      createdAt: block.created_at,
    }))
    .sort((a, b) => a.position - b.position);

/**
 * The serialization boundary for an article and its relations. Null when the status did not
 * come back: the join is !inner, so an article whose status row is unreadable is not returned at
 * all, rather than arriving with a status the mapping would have to invent.
 */
export const toArticleRow = (row: ArticleRecord): ArticleRow | null => {
  const status = toOne(row.article_status);
  if (status === null) return null;

  return {
    id: row.id,
    articleStatusId: row.article_status_id,
    canonicalSlug: row.canonical_slug,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    embargoExpiresAt: row.embargo_expires_at,
    commentAllowed: row.comment_allowed,
    leadMediaAssetId: row.lead_media_asset_id,
    createdAt: row.created_at,
    status: { id: status.id, slug: status.slug, position: status.position },
    // Byline order is editorial: the first name is the lead, so the position column is the
    // sort, not the author's id or name.
    bylines: (row.article_byline ?? [])
      .map((byline) => ({ position: byline.position, author: toOne(byline.author_profile) }))
      .filter(
        (byline): byline is { position: number; author: NonNullable<typeof byline.author> } =>
          byline.author !== null
      )
      .sort((a, b) => a.position - b.position)
      .map(({ author }) => ({
        id: author.id,
        userAccountId: author.user_account_id,
        slug: author.slug,
        active: author.active,
        createdAt: author.created_at,
      })),
    sections: (row.article_section ?? [])
      .map((entry) => toOne(entry.section))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({
        id: entry.id,
        parentSectionId: entry.parent_section_id,
        slug: entry.slug,
        position: entry.position,
        active: entry.active,
        createdAt: entry.created_at,
      })),
    topics: (row.article_topic ?? [])
      .map((entry) => toOne(entry.topic))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        active: entry.active,
        createdAt: entry.created_at,
      })),
    tags: (row.article_tag ?? [])
      .map((entry) => toOne(entry.tag))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        active: entry.active,
        createdAt: entry.created_at,
      })),
  };
};

const toArticleRows = (rows: ArticleRecord[]): ArticleRow[] =>
  rows.map(toArticleRow).filter((article): article is ArticleRow => article !== null);

/**
 * An article with its whole body, by its URL slug. Null covers both "no such slug" and "RLS
 * refused it", which is the same answer either way: a reader who may not see a draft should
 * not learn that it exists.
 */
export async function getArticleBySlug(
  supabase: SupabaseClient,
  canonicalSlug: string
): Promise<QueryResult<ArticleWithBlocks | null>> {
  const { data: row, error } = await selectArticleWithBlocks(supabase)
    .eq('canonical_slug', canonicalSlug)
    .maybeSingle();
  if (error) return { data: null, error };
  const article = row ? toArticleRow(row) : null;
  if (row === null || article === null) return { data: null, error: null };
  return { data: { ...article, blocks: toArticleBlocks(row.article_block) }, error: null };
}

/** An article with its whole body, by id. */
export async function getArticle(
  supabase: SupabaseClient,
  id: number
): Promise<QueryResult<ArticleWithBlocks | null>> {
  const { data: row, error } = await selectArticleWithBlocks(supabase).eq('id', id).maybeSingle();
  if (error) return { data: null, error };
  const article = row ? toArticleRow(row) : null;
  if (row === null || article === null) return { data: null, error: null };
  return { data: { ...article, blocks: toArticleBlocks(row.article_block) }, error: null };
}

/** Only the id, for an action that needs to know which article a slug names. */
export async function getArticleIdBySlug(
  supabase: SupabaseClient,
  canonicalSlug: string
): Promise<QueryResult<Pick<Article, 'id'> | null>> {
  const { data, error } = await supabase
    .from('article')
    .select('id')
    .eq('canonical_slug', canonicalSlug)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

/** The most recently published articles the caller may see, newest first. */
export async function listLatestArticle(
  supabase: SupabaseClient,
  limit: number
): Promise<QueryResult<ArticleRow[]>> {
  const { data, error } = await selectArticleRow(supabase)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) return { data: null, error };
  return { data: toArticleRows(data), error: null };
}

/** Articles not deleted, newest first, optionally of one status, with the total matching. */
export async function listArticle(
  supabase: SupabaseClient,
  filter: { articleStatusId: number | null },
  range: QueryRange
): Promise<QueryResult<CountedRows<ArticleRow>>> {
  let query = selectArticleRow(supabase, 'exact')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(range.offset, range.offset + range.limit - 1);
  if (filter.articleStatusId !== null) query = query.eq('article_status_id', filter.articleStatusId);

  const { data, error, count } = await query;
  if (error) return { data: null, error };
  const articles = toArticleRows(data);
  return { data: { rows: articles, total: count ?? articles.length }, error: null };
}

/**
 * One insert. The headline is entity-bound copy written separately, through
 * createLocalTextEntry. Returns the new article's id.
 */
/**
 * A new article, its headline in one locale, and the creator as its author, in one transaction
 * (content_create_article). The article starts at the first unpublished status. Being its author
 * is what lets a Writer keep editing it. Refused with 42501 without `article.create`, and with
 * 23505 for a canonical slug already in use.
 */
export async function createArticle(
  supabase: SupabaseClient,
  fields: Pick<Article, 'canonicalSlug'> & { localeId: number; headline: string }
): Promise<QueryResult<number>> {
  const { data, error } = await supabase.rpc('content_create_article', {
    p_canonical_slug: fields.canonicalSlug,
    p_locale_id: fields.localeId,
    p_headline: fields.headline,
  });
  if (error) return { data: null, error };
  return { data: Number(data), error: null };
}

/**
 * Moves an article through the workflow. The required-checklist gate is inside the function,
 * so it cannot be bypassed by posting a form directly. It raises 42501 when the caller may not
 * change the status, and otherwise with the unsatisfied checklist item slugs in its message.
 */
export async function transitionArticleStatus(
  supabase: SupabaseClient,
  id: number,
  statusSlug: string
): Promise<QueryResult<null>> {
  const { error } = await supabase.rpc('content_transition_article_status', {
    p_article_id: id,
    p_status_slug: statusSlug,
  });
  if (error) return { data: null, error };
  return { data: null, error: null };
}
