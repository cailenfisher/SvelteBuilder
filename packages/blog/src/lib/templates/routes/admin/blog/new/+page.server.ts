import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createPost } from '@sveltebuilder/blog/server';

export const load: PageServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/sign-in');
  return { user };
};

// This form manages only structural post fields (status, featured, allowComment).
// Title / body / excerpt copy is entered through the main LocalText admin UI, not here.
export const actions: Actions = {
  default: async ({ locals, request }) => {
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) throw redirect(303, '/sign-in');

    const form = await request.formData();
    const status      = (form.get('status') as string) || 'draft';
    const featured    = form.get('featured') === 'on';
    const allowComment = form.get('allow_comment') !== 'off';

    try {
      const id = await createPost(locals.supabase, {
        userAccountId: user.id,
        status: status as import('@sveltebuilder/blog').PostStatus,
        featured,
        allowComment,
      });
      throw redirect(303, `/admin/blog/${id}`);
    } catch (e) {
      if (e instanceof Response) throw e; // re-throw SvelteKit redirects
      return fail(500, { message: 'Failed to create post.' });
    }
  },
};
