import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminPost, updatePost, publishPost, unpublishPost } from '@sveltebuilder/blog/server';
import type { PostStatus } from '@sveltebuilder/blog';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');

  const post = await getAdminPost(locals.supabase, Number(params.id));
  if (!post) throw error(404, 'Post not found.');

  return { post };
};

// This form manages only structural post fields (status, featured, allowComment).
// Title / body / excerpt copy is entered through the main LocalText admin UI, not here.
export const actions: Actions = {
  save: async ({ locals, params, request }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    const form = await request.formData();
    const status       = form.get('status') as PostStatus;
    const featured     = form.get('featured') === 'on';
    const allowComment = form.get('allow_comment') !== 'off';
    const readingTimeRaw = form.get('reading_time_minute');
    const readingTimeMinute = readingTimeRaw ? Number(readingTimeRaw) : null;

    try {
      await updatePost(locals.supabase, Number(params.id), {
        status,
        featured,
        allowComment,
        readingTimeMinute,
      });
    } catch {
      return fail(500, { message: 'Failed to update post.' });
    }

    return { success: true };
  },

  publish: async ({ locals, params }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    try {
      await publishPost(locals.supabase, Number(params.id));
    } catch {
      return fail(500, { message: 'Failed to publish post.' });
    }

    return { success: true };
  },

  unpublish: async ({ locals, params }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, '/sign-in');

    try {
      await unpublishPost(locals.supabase, Number(params.id));
    } catch {
      return fail(500, { message: 'Failed to unpublish post.' });
    }

    return { success: true };
  },
};
