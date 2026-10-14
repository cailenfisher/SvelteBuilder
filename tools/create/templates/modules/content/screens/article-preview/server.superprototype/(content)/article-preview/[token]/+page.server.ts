import { error } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { getArticleByPreviewToken } from '$lib/server/content/article-preview-token';
import { getArticleStatus } from '$lib/server/content/article-status';
import { listMediaAsset, listMediaAssetAttribution } from '$lib/server/content/media-asset';
import type { ArticlePreviewDetailView } from '@sveltebuilder/content/views';
import type { PageServerLoad } from './$types';

// The token is the credential; see getArticleByPreviewToken for why it never reads the article
// directly. An invalid token and a missing article are the same 404.

const STORAGE_BASE_URL = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

export const load: PageServerLoad = async ({ locals, params }): Promise<ArticlePreviewDetailView> => {
  const previewResult = await getArticleByPreviewToken(locals.supabase, params.token);

  if (previewResult.error) throw error(500, 'Failed to load the preview.');
  if (!previewResult.data) throw error(404, 'Preview not found, or the link has expired.');

  const { article, blocks } = previewResult.data;

  // The relations are read normally rather than through the token, because none of them is
  // secret: a status, a byline and a section leak nothing about an unpublished story's content.
  // The join tables' own read policies gate them on the article being public, so for a draft
  // these come back empty — a preview shows the body, not the filing.
  const mediaAssetIds = [
    ...new Set(
      [...blocks.map((b) => b.mediaAssetId), article.leadMediaAssetId].filter(
        (id): id is number => id !== null
      )
    ),
  ];

  const [statusResult, mediaResult, attributionResult, uiCopy] = await Promise.all([
    getArticleStatus(locals.supabase, article.articleStatusId),
    listMediaAsset(locals.supabase, mediaAssetIds),
    listMediaAssetAttribution(locals.supabase, mediaAssetIds),
    loadScopedCopy(locals.supabase, ['content'], locals.locale.code, locals.defaultLocale.code),
  ]);

  if (statusResult.error) throw error(500, 'Failed to load the article status.');
  if (mediaResult.error) throw error(500, 'Failed to load media.');
  if (attributionResult.error) throw error(500, 'Failed to load media credits.');

  const entityCopy = await loadEntityCopy(
    locals.supabase,
    [
      { scope: 'article', ids: [article.id] },
      { scope: 'article_block', ids: blocks.map((block) => block.id) },
      { scope: 'article_status', ids: statusResult.data ? [statusResult.data.id] : [] },
      { scope: 'media_asset', ids: mediaResult.data.map((asset) => asset.id) },
    ],
    locals.locale.code,
    locals.defaultLocale.code
  );

  return {
    article: {
      ...article,
      // article_status is world-readable, so a missing row is unreachable in practice; the
      // shape is satisfied rather than asserted so a missing row cannot crash a preview.
      status: statusResult.data ?? { id: article.articleStatusId, slug: 'draft', position: 0 },
      blocks,
      bylines: [],
      sections: [],
      topics: [],
      tags: [],
    },
    attributions: attributionResult.data,
    storageBaseUrl: STORAGE_BASE_URL,
    mediaAssets: mediaResult.data,
    localeCode: locals.locale.code,
    copy: [...uiCopy, ...entityCopy],
  };
};
