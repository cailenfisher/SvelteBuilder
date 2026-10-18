import { error, redirect } from '@sveltejs/kit';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { createArticle, listArticle } from '$lib/server/content/article';
import { listArticleStatus } from '$lib/server/content/article-status';
import { currentUserCan } from '$lib/server/permission';
import { loadArticleAction } from './article-action';
import type { ArticleAdminListView } from '@sveltebuilder/content/views';
import type { Actions, PageServerLoad } from './$types';
import { formError } from '$lib/server/form-error';
import { requireScope } from '../../require-access';

// The (admin) layout admits staff; this screen admits those holding anything on articles. RLS
// decides which articles they see: every one at every status with `article.read`, or only those
// they are assigned to or given, plus whatever is published.

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ locals, url, parent }): Promise<ArticleAdminListView> => {
  await requireScope(parent, 'article');

  const statusSlug = url.searchParams.get('status');

  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const statusesResult = await listArticleStatus(locals.supabase);
  if (statusesResult.error) throw error(500, 'Failed to load statuses.');

  const statuses = statusesResult.data;

  // An unknown status in the query string filters to nothing rather than silently showing
  // everything, which would be the more confusing of the two.
  const status = statusSlug === null ? null : (statuses.find((s) => s.slug === statusSlug) ?? null);

  const articlesResult = await listArticle(
    locals.supabase,
    { articleStatusId: status?.id ?? null },
    { offset: (page - 1) * PER_PAGE, limit: PER_PAGE }
  );
  if (articlesResult.error) throw error(500, 'Failed to load articles.');

  const [articleActions, createResult] = await Promise.all([
    loadArticleAction(
      locals.supabase,
      articlesResult.data.rows.map((article) => article.id)
    ),
    currentUserCan(locals.supabase, 'article', 'create'),
  ]);
  if (createResult.error) throw error(500, 'Failed to load article permissions.');

  const articles = articlesResult.data.rows.map((article) => ({
    ...article,
    actions: articleActions.get(article.id) ?? [],
  }));

  const [uiCopy, entityCopy] = await Promise.all([
    loadScopedCopy(locals.supabase, ['content'], locals.locale.code, locals.defaultLocale.code),
    loadEntityCopy(
      locals.supabase,
      [
        { scope: 'article', ids: articles.map((article) => article.id) },
        { scope: 'article_status', ids: statuses.map((s) => s.id) },
        {
          scope: 'author_profile',
          ids: articles.flatMap((article) => article.bylines.map((author) => author.id)),
        },
        {
          scope: 'section',
          ids: articles.flatMap((article) => article.sections.map((entry) => entry.id)),
        },
      ],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  return {
    articles,
    statuses,
    statusSlug: status?.slug ?? null,
    total: articlesResult.data.total,
    page,
    perPage: PER_PAGE,
    localeCode: locals.locale.code,
    copy: [...uiCopy, ...entityCopy],
    articleActions: createResult.data ? ['create'] : [],
  };
};

export const actions: Actions = {
  // The article, its headline and its creator's authorship land together, in one RPC: a headline
  // is what makes an article findable in the admin list, and authorship is what lets a Writer keep
  // editing what they created.
  create: async ({ locals, request }) => {
    const form = await request.formData();
    const canonicalSlug = (form.get('canonical_slug') as string | null)?.trim();
    const headline = (form.get('headline') as string | null)?.trim();

    if (!canonicalSlug) return formError(422, 'content.error.slug_required');
    if (!headline) return formError(422, 'content.error.headline_required');

    const { data: articleId, error: createError } = await createArticle(locals.supabase, {
      canonicalSlug,
      localeId: locals.locale.id,
      headline,
    });

    if (createError) {
      // 23505 is unique_violation on canonical_slug, which is a user error rather than a fault.
      if (createError.code === '23505') return formError(409, 'content.error.slug_in_use');
      if (createError.code === '42501') return formError(403, 'content.error.article_create_forbidden');
      return formError(500, 'content.error.article_create_failed');
    }

    redirect(303, `/admin/content/article/${articleId}`);
  },
};
