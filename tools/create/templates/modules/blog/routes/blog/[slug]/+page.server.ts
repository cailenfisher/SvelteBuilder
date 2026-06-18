import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedPostBySlug, getComments, buildPostDictionaryPayload } from '@sveltebuilder/blog/server';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { locale, defaultLocale } = locals;
  const supabase = locals.supabase;

  const [post, comments] = await Promise.all([
    getPublishedPostBySlug(supabase, params.slug, locale.code, defaultLocale.code),
    // Comments are fetched optimistically; handled after post null-check below.
    Promise.resolve(null),
  ]);

  if (!post) {
    throw error(404, 'Post not found.');
  }

  // Fetch author display name and comments in parallel now that we have the post id.
  const [commentsData, authorData] = await Promise.all([
    getComments(supabase, post.id),
    locals.supabase
      .from('user_account')
      .select('display_name')
      .eq('id', post.userAccountId)
      .maybeSingle(),
  ]);

  const authorName = (authorData.data?.display_name as string | null) ?? 'Anonymous';

  // Build a full hermes DictionaryPayload for this post (title, excerpt, body, categories, tags).
  const dictionaryPayload = buildPostDictionaryPayload(post, locale.code);

  return {
    post,
    comments: commentsData,
    authorName,
    dictionaryPayload,
  };
};
