import { error, fail, redirect } from '@sveltejs/kit';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { createLocalTextEntry } from '$lib/server/local-text';
import { createArticle, listArticle } from '$lib/server/content/article';
import { getInitialArticleStatus, listArticleStatus } from '$lib/server/content/article-status';
import type { ArticleAdminListView } from '@sveltebuilder/content/views';
import type { Actions, PageServerLoad } from './$types';

// Guards live in the (admin) layout load; RLS refuses these writes for a non-admin regardless.
// Note what this means for the list: an admin sees every article at every status, because the
// article admin policy is `for all`, while the public read policy only admits published ones.

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ locals, url }): Promise<ArticleAdminListView> => {
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

  const articles = articlesResult.data.rows;

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
  };
};

export const actions: Actions = {
  // Two statements — the article and its headline copy — so it goes through the base template's
  // create_local_text_entry for the copy half, after the article insert. A headline is what makes
  // an article findable in the admin list, so creating one without it would produce a row the
  // editor cannot identify among its siblings.
  create: async ({ locals, request }) => {
    const form = await request.formData();
    const canonicalSlug = (form.get('canonical_slug') as string | null)?.trim();
    const headline = (form.get('headline') as string | null)?.trim();

    if (!canonicalSlug) return fail(422, { error: 'A URL slug is required.' });
    if (!headline) return fail(422, { error: 'A headline is required.' });

    const statusResult = await getInitialArticleStatus(locals.supabase);

    if (statusResult.error || !statusResult.data) {
      return fail(500, { error: 'No article statuses are configured.' });
    }

    const { data: articleId, error: insertError } = await createArticle(locals.supabase, {
      articleStatusId: statusResult.data.id,
      canonicalSlug,
    });

    if (insertError) {
      // 23505 is unique_violation on canonical_slug, which is a user error rather than a fault.
      if (insertError.code === '23505') {
        return fail(409, { error: 'That URL slug is already in use.' });
      }
      return fail(500, { error: 'Failed to create the article.' });
    }

    const { error: copyError } = await createLocalTextEntry(locals.supabase, {
      slug: 'headline',
      scope: 'article',
      entityId: articleId,
      localeIds: [locals.locale.id],
      contents: [headline],
    });

    if (copyError) {
      // The article exists but has no headline. Report it rather than pretending: the editor can
      // set one on the detail screen, and silently redirecting would hide a half-finished create.
      return fail(500, {
        error: 'The article was created but its headline could not be saved. Open it and set one.',
      });
    }

    redirect(303, `/admin/content/article/${articleId}`);
  },
};
