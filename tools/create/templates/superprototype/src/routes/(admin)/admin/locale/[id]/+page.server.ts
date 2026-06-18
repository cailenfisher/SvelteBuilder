import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { locale } from '@sveltebuilder/hermes-schema/schema';

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const rows = await locals.db.withUser(async (tx) => {
    return tx
      .select({
        id: locale.id,
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
        dir: locale.dir,
      })
      .from(locale)
      .where(eq(locale.id, id))
      .limit(1);
  });

  if (!rows[0]) throw error(404, 'Locale not found');

  return { locale: rows[0] };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const form = await request.formData();

    const code = (form.get('code') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();
    const nativeName = (form.get('native_name') as string | null)?.trim();
    const dir = (form.get('dir') as string | null)?.trim() || 'ltr';

    if (isNaN(id) || !code || !name || !nativeName) {
      return fail(422, { error: 'Code, name, and native name are required.' });
    }

    await locals.db.withUser(async (tx) => {
      await tx.update(locale).set({ code, name, nativeName, dir }).where(eq(locale.id, id));
    });

    return { success: true };
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    await locals.db.withUser(async (tx) => {
      await tx.delete(locale).where(eq(locale.id, id));
    });

    throw redirect(303, '/admin/locale');
  },
};
