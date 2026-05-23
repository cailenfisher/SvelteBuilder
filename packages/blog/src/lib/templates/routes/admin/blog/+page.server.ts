import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAdminPosts } from '@sveltebuilder/blog/server';
import type { PostStatus } from '@sveltebuilder/blog';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const supabase = locals.supabase;
  const { locale } = locals;

  const status  = (url.searchParams.get('status') ?? undefined) as PostStatus | undefined;
  const page    = Number(url.searchParams.get('page') ?? '1');
  const perPage = Number(url.searchParams.get('per_page') ?? '20');

  const { posts, total } = await getAdminPosts(supabase, { status, page, perPage });

  return { posts, total, status, page, perPage, locale };
};
