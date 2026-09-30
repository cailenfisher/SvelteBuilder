import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  getArticleByPreviewToken,
  buildArticleDictionaryPayload,
  getPublisherProfile,
} from '@sveltebuilder/content/server';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const { locale, defaultLocale } = locals;

  const [article, publisherProfile] = await Promise.all([
    getArticleByPreviewToken(locals.supabase, params.token, locale.code, defaultLocale.code),
    getPublisherProfile(locals.supabase),
  ]);

  if (!article) {
    error(404, 'Preview not found or token has expired.');
  }

  const dictionaryPayload = await buildArticleDictionaryPayload(article, locale.code);

  return {
    article,
    publisherProfile,
    dictionaryPayload,
    canonicalUrl: `${url.origin}/article/${article.canonicalSlug}`,
    isPreview: true,
  };
};
