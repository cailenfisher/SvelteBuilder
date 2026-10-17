import type { SupabaseClient } from '@supabase/supabase-js';
import type { Article, ArticleBlock } from '@sveltebuilder/content';
import type { QueryResult } from '$lib/server/postgrest';

// supabase-js infers a row type from a `.select()` string literal, but an `.rpc()` call is just
// a function name: it has no way to know what comes back without generated database types, so it
// types the result as `{}`. These two shapes mirror what the functions return, which is
// `setof article` and `setof article_block`: the tables' own columns, snake_case.
type PreviewArticleRecord = {
  id: number;
  article_status_id: number;
  canonical_slug: string;
  published_at: string | null;
  updated_at: string;
  deleted_at: string | null;
  embargo_expires_at: string | null;
  comment_allowed: boolean;
  lead_media_asset_id: number | null;
  created_at: string;
};

type PreviewBlockRecord = {
  id: number;
  article_id: number;
  block_type: ArticleBlock['blockType'];
  position: number;
  content: ArticleBlock['content'];
  media_asset_id: number | null;
  created_at: string;
};

/**
 * An unpublished article and its blocks, by preview token. The token is the credential: this
 * presents it to two SECURITY DEFINER functions rather than reading the article directly, because
 * RLS hides an unpublished article and a policy cannot see which token a request carried.
 * Admitting "any article with a live token" would make every draft with an outstanding preview
 * link world-readable. See the module's supabase/supplemental/02-content-rls.sql.
 *
 * Both functions return no rows for a token that is unknown or expired, so null means either.
 */
export async function getArticleByPreviewToken(
  supabase: SupabaseClient,
  token: string
): Promise<QueryResult<{ article: Article; blocks: ArticleBlock[] } | null>> {
  const [articleResult, blocksResult] = await Promise.all([
    supabase.rpc('content_preview_article', { p_token: token }).maybeSingle(),
    supabase.rpc('content_preview_blocks', { p_token: token }),
  ]);
  if (articleResult.error) return { data: null, error: articleResult.error };
  if (blocksResult.error) return { data: null, error: blocksResult.error };
  if (!articleResult.data) return { data: null, error: null };

  const row = articleResult.data as PreviewArticleRecord;
  const blocks = ((blocksResult.data ?? []) as PreviewBlockRecord[])
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

  return {
    data: {
      article: {
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
      },
      blocks,
    },
    error: null,
  };
}
