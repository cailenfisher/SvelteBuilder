import type { PageServerLoad } from './$types';
import { getPublishedPosts, getCategories, getTags, buildDictionaryPayload } from '@sveltebuilder/blog/server';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { locale, defaultLocale } = locals;
  const supabase = locals.supabase;

  const page    = Number(url.searchParams.get('page') ?? '1');
  const perPage = Number(url.searchParams.get('per_page') ?? '10');
  const categorySlug = url.searchParams.get('category') ?? undefined;
  const tagSlug      = url.searchParams.get('tag') ?? undefined;

  const [{ posts, total }, categories, tags] = await Promise.all([
    getPublishedPosts(supabase, locale.code, {
      categorySlug,
      tagSlug,
      page,
      perPage,
      fallbackLocale: defaultLocale.code,
    }),
    getCategories(supabase, locale.code, defaultLocale.code),
    getTags(supabase, locale.code, defaultLocale.code),
  ]);

  // Build a hermes DictionaryPayload so PostCard can call localText() client-side.
  const dictionaryPayload = buildDictionaryPayload(posts, locale.code);

  return {
    posts,
    total,
    categories,
    tags,
    page,
    perPage,
    categorySlug,
    tagSlug,
    dictionaryPayload,
  };
};
