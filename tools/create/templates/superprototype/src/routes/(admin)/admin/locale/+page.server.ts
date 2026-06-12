import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { locale } from '@sveltebuilder/hermes-schema/schema';

export const load: PageServerLoad = async ({ locals }) => {
  const locales = await locals.db.withUser(async (tx) => {
    return tx
      .select({
        id: locale.id,
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
        dir: locale.dir,
      })
      .from(locale)
      .orderBy(asc(locale.code));
  });

  return { locales };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const code = (form.get('code') as string | null)?.trim();
    const name = (form.get('name') as string | null)?.trim();
    const nativeName = (form.get('native_name') as string | null)?.trim();
    const dir = (form.get('dir') as string | null)?.trim() || 'ltr';

    if (!code || !name || !nativeName) {
      return fail(422, { error: 'Code, name, and native name are required.' });
    }

    await locals.db.withUser(async (tx) => {
      await tx.insert(locale).values({ code, name, nativeName, dir });
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    await locals.db.withUser(async (tx) => {
      await tx.delete(locale).where(eq(locale.id, id));
    });

    return { success: true };
  },
};
