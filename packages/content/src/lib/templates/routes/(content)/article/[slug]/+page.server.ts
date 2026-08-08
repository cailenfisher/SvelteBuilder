import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  getPublishedArticleBySlug,
  getApprovedComments,
  buildArticleDictionaryPayload,
  createComment,
  getPublisherProfile,
} from '@sveltebuilder/content/server';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const { locale, defaultLocale } = locals;

  const [article, publisherProfile] = await Promise.all([
    getPublishedArticleBySlug(locals.supabase, params.slug, locale.code, defaultLocale.code),
    getPublisherProfile(locals.supabase),
  ]);

  if (!article) {
    error(404, 'Article not found.');
  }

  const [comments, dictionaryPayload] = await Promise.all([
    article.allowComment ? getApprovedComments(locals.supabase, article.id) : Promise.resolve([]),
    buildArticleDictionaryPayload(article, locale.code),
  ]);

  return {
    article,
    comments,
    publisherProfile,
    dictionaryPayload,
    canonicalUrl: `${url.origin}/article/${article.canonicalSlug}`,
  };
};

export const actions: Actions = {
  comment: async ({ request, locals, params }) => {
    const { locale, defaultLocale } = locals;
    const data = await request.formData();

    const article = await getPublishedArticleBySlug(
      locals.supabase,
      params.slug,
      locale.code,
      defaultLocale.code,
    );

    if (!article?.allowComment) {
      error(403, 'Comments are not enabled for this article.');
    }

    const authorName  = String(data.get('author_name') ?? '').trim();
    const authorEmail = String(data.get('author_email') ?? '').trim();
    const body        = String(data.get('body') ?? '').trim();

    if (!authorName || !authorEmail || !body) {
      return { success: false, error: 'All fields are required.' };
    }

    await createComment(locals.supabase, {
      articleId:   article.id,
      userAccountId: locals.userAccountId ?? null,
      authorName,
      authorEmail,
      body,
    });

    return { success: true };
  },
};
