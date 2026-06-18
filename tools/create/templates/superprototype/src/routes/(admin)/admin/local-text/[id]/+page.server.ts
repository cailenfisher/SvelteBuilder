import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { locale, localTextLink, localText } from '@sveltebuilder/hermes-schema/schema';

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [entries, translations, locales] = await locals.db.withUser(async (tx) => {
    return Promise.all([
      tx
        .select({
          id: localTextLink.id,
          slug: localTextLink.slug,
          scope: localTextLink.scope,
          entityId: localTextLink.entityId,
        })
        .from(localTextLink)
        .where(eq(localTextLink.id, id))
        .limit(1),
      tx
        .select({
          id: localText.id,
          link: localText.link,
          locale: localText.locale,
          content: localText.content,
        })
        .from(localText)
        .where(eq(localText.link, id)),
      tx
        .select({
          id: locale.id,
          code: locale.code,
          nativeName: locale.nativeName,
        })
        .from(locale)
        .orderBy(asc(locale.code)),
    ]);
  });

  if (!entries[0]) throw error(404, 'Entry not found');

  return {
    entry: entries[0],
    translations,
    locales,
  };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const linkId = parseInt(params.id);
    const form = await request.formData();

    const localeId = parseInt(form.get('locale_id') as string);
    const content = (form.get('content') as string | null)?.trim() ?? '';

    if (isNaN(linkId) || isNaN(localeId)) return fail(422, { error: 'Invalid parameters.' });

    await locals.db.withUser(async (tx) => {
      await tx
        .insert(localText)
        .values({ link: linkId, locale: localeId, content })
        .onConflictDoUpdate({
          target: [localText.link, localText.locale],
          set: { content },
        });
    });

    return { success: true };
  },

  delete: async ({ params, locals }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    await locals.db.withUser(async (tx) => {
      await tx.delete(localText).where(eq(localText.link, id));
      await tx.delete(localTextLink).where(eq(localTextLink.id, id));
    });

    throw redirect(303, '/admin/local-text');
  },
};
