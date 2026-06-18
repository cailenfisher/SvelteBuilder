import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { locale, localTextLink, localText } from '@sveltebuilder/hermes-schema/schema';

export const load: PageServerLoad = async ({ locals }) => {
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
        .orderBy(asc(localTextLink.slug)),
      tx
        .select({
          id: localText.id,
          link: localText.link,
          locale: localText.locale,
          content: localText.content,
        })
        .from(localText),
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

  return { entries, translations, locales };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const slug = (form.get('slug') as string | null)?.trim();
    const scope = (form.get('scope') as string | null)?.trim() || null;

    if (!slug) return fail(422, { error: 'Slug is required.' });

    const localeIds = form.getAll('locale_id') as string[];
    const contents = form.getAll('content') as string[];

    await locals.db.withUser(async (tx) => {
      const [link] = await tx
        .insert(localTextLink)
        .values({ slug, scope, entityId: null })
        .returning({ id: localTextLink.id });

      if (!link) throw new Error('Failed to create copy link.');

      const translations = localeIds
        .map((localeId, i) => ({
          link: link.id,
          locale: parseInt(localeId),
          content: contents[i],
        }))
        .filter((t) => t.content?.trim());

      if (translations.length > 0) {
        await tx.insert(localText).values(translations);
      }
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    // Delete texts first (FK constraint), then the link — one atomic transaction.
    await locals.db.withUser(async (tx) => {
      await tx.delete(localText).where(eq(localText.link, id));
      await tx.delete(localTextLink).where(eq(localTextLink.id, id));
    });

    return { success: true };
  },
};
