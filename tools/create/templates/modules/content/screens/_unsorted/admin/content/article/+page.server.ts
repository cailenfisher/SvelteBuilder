import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdminArticles, buildArticleListDictionaryPayload } from '@sveltebuilder/content/server';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.userAccountId) error(401, 'Unauthorized.');

  const { locale, defaultLocale } = locals;
  const page    = Number(url.searchParams.get('page') ?? 1);
  const perPage = Number(url.searchParams.get('per_page') ?? 25);

  const result = await locals.db.withUser(async (tx) => {
    return getAdminArticles(tx, {
      locale: locale.code,
      defaultLocale: defaultLocale.code,
      page,
      perPage,
    });
  });

  const dictionaryPayload = buildArticleListDictionaryPayload(result.items, locale.code);

  return { result, dictionaryPayload, page, perPage };
};
