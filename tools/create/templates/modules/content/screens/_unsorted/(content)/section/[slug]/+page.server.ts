import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  getSectionFront,
  getPublishedArticles,
  buildArticleListDictionaryPayload,
} from '@sveltebuilder/content/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { locale, defaultLocale } = locals;

  const [front, articlesResult] = await Promise.all([
    getSectionFront(locals.supabase, params.slug, locale.code, defaultLocale.code),
    getPublishedArticles(locals.supabase, {
      sectionSlug: params.slug,
      locale: locale.code,
      defaultLocale: defaultLocale.code,
      page: 1,
      perPage: 20,
    }),
  ]);

  if (!front) {
    error(404, 'Section not found.');
  }

  const dictionaryPayload = buildArticleListDictionaryPayload(
    articlesResult.items,
    locale.code,
  );

  return {
    front,
    articles: articlesResult,
    dictionaryPayload,
  };
};
