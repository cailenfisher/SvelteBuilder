import { error, fail } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { getArticleBySlug, getArticleIdBySlug } from '$lib/server/content/article';
import { createComment, listComment } from '$lib/server/content/comment';
import { listMediaAsset, listMediaAssetAttribution } from '$lib/server/content/media-asset';
import { getPublisherProfile } from '$lib/server/content/publisher-profile';
import type { ArticleDetailView } from '@sveltebuilder/content/views';
import type { Actions, PageServerLoad } from './$types';

// No auth guard: this is a public page. What a reader may see is decided entirely by the
// module's RLS policies — a draft, an embargoed article and a soft-deleted one are all
// invisible to anon, so this loader does not re-implement that rule. See the module's
// supabase/supplemental/02-content-rls.sql.

// Where a storageKey resolves to a URL. Supabase-specific, which is why it comes from the
// loader rather than the screen: the screen is flavour-neutral and should not know.
const STORAGE_BASE_URL = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

export const load: PageServerLoad = async ({ locals, params, url }): Promise<ArticleDetailView> => {
  const articleResult = await getArticleBySlug(locals.supabase, params.slug);

  if (articleResult.error) throw error(500, 'Failed to load the article.');
  if (!articleResult.data) throw error(404, 'Article not found.');

  const article = {
    ...articleResult.data,
    sections: [...articleResult.data.sections].sort((a, b) => a.position - b.position),
  };

  // The blocks' assets, plus the editor's explicit lead image, which the body may not contain.
  const mediaAssetIds = [
    ...new Set(
      [...article.blocks.map((block) => block.mediaAssetId), article.leadMediaAssetId].filter(
        (id): id is number => id !== null
      )
    ),
  ];

  const [commentsResult, publisherResult, mediaResult, attributionResult, uiCopy, entityCopy] =
    await Promise.all([
      article.commentAllowed
        ? listComment(locals.supabase, article.id)
        : Promise.resolve({ data: [], error: null }),
      getPublisherProfile(locals.supabase),
      listMediaAsset(locals.supabase, mediaAssetIds),
      listMediaAssetAttribution(locals.supabase, mediaAssetIds),
      // 'publisher_profile' loaded by scope rather than by id: it is a singleton, so the scope
      // is bounded, and asking for it by id would mean referencing the publisher query's own
      // result from inside the Promise.all that defines it.
      loadScopedCopy(
        locals.supabase,
        ['content', 'publisher_profile'],
        locals.locale.code,
        locals.defaultLocale.code
      ),
      // Entity copy by id rather than by scope: 'article' is unbounded, so loading the whole
      // scope would ship every headline in the database to render one page.
      loadEntityCopy(
        locals.supabase,
        [
          { scope: 'article', ids: [article.id] },
          { scope: 'article_status', ids: [article.status.id] },
          { scope: 'article_block', ids: article.blocks.map((block) => block.id) },
          { scope: 'author_profile', ids: article.bylines.map((author) => author.id) },
          { scope: 'section', ids: article.sections.map((section) => section.id) },
          { scope: 'topic', ids: article.topics.map((topic) => topic.id) },
          { scope: 'tag', ids: article.tags.map((tag) => tag.id) },
          { scope: 'media_asset', ids: mediaAssetIds },
        ],
        locals.locale.code,
        locals.defaultLocale.code
      ),
    ]);

  if (commentsResult.error) throw error(500, 'Failed to load comments.');
  if (mediaResult.error) throw error(500, 'Failed to load media.');
  if (attributionResult.error) throw error(500, 'Failed to load media credits.');
  // A missing publisher costs the page only its publisher logo, so it does not fail the
  // article; it is logged so the failure is not silent.
  if (publisherResult.error) {
    console.error('[content] publisher profile query error:', publisherResult.error);
  }

  return {
    article,
    comments: commentsResult.data,
    publisherProfile: publisherResult.data ?? null,
    canonicalUrl: `${url.origin}/article/${article.canonicalSlug}`,
    storageBaseUrl: STORAGE_BASE_URL,
    mediaAssets: mediaResult.data,
    attributions: attributionResult.data,
    localeCode: locals.locale.code,
    copy: [...uiCopy, ...entityCopy],
  };
};

export const actions: Actions = {
  comment: async ({ locals, params, request }) => {
    const form = await request.formData();
    const authorName = (form.get('author_name') as string | null)?.trim();
    const authorEmail = (form.get('author_email') as string | null)?.trim();
    const body = (form.get('body') as string | null)?.trim();

    if (!authorName || !authorEmail || !body) {
      return fail(422, { error: 'Name, email and comment are all required.' });
    }

    const articleResult = await getArticleIdBySlug(locals.supabase, params.slug);

    if (articleResult.error) throw error(500, 'Failed to load the article.');
    if (!articleResult.data) throw error(404, 'Article not found.');

    const { error: insertError } = await createComment(locals.supabase, {
      articleId: articleResult.data.id,
      userAccountId: locals.userAccountId,
      authorName,
      authorEmail,
      body,
    });

    if (insertError) {
      // 42501 is insufficient_privilege: the insert policy refused it, which here means the
      // article does not accept comments. That is an answer to the reader, not a fault.
      if (insertError.code === '42501') {
        return fail(403, { error: 'This article is not accepting comments.' });
      }
      return fail(500, { error: 'Failed to submit your comment.' });
    }

    return { success: true as const };
  },
};
