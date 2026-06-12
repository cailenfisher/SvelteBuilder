import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { navigationItem } from '$lib/server/schema';
import { locale, localTextLink, localText } from '@sveltebuilder/hermes-schema/schema';

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = parseInt(params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const [navItems, locales] = await locals.db.withUser(async (tx) => {
    return Promise.all([
      tx
        .select({
          id: navigationItem.id,
          href: navigationItem.href,
          scope: navigationItem.scope,
          sortOrder: navigationItem.sortOrder,
          active: navigationItem.active,
          localTextLink: {
            id: localTextLink.id,
            slug: localTextLink.slug,
            scope: localTextLink.scope,
          },
        })
        .from(navigationItem)
        .leftJoin(localTextLink, eq(navigationItem.localTextLinkId, localTextLink.id))
        .where(eq(navigationItem.id, id))
        .limit(1),
      tx
        .select({ id: locale.id, code: locale.code, nativeName: locale.nativeName })
        .from(locale)
        .orderBy(asc(locale.code)),
    ]);
  });

  const navItem = navItems[0];
  if (!navItem) throw error(404, 'Navigation item not found');

  const linkId = navItem.localTextLink?.id;
  const translations = linkId
    ? await locals.db.withUser(async (tx) => {
        return tx
          .select({
            id: localText.id,
            link: localText.link,
            locale: localText.locale,
            content: localText.content,
          })
          .from(localText)
          .where(eq(localText.link, linkId));
      })
    : [];

  return { navItem, translations, locales };
};

export const actions: Actions = {
  update: async ({ params, request, locals }) => {
    const id = parseInt(params.id);
    const form = await request.formData();

    const href = (form.get('href') as string | null)?.trim();
    const scope = (form.get('scope') as string | null)?.trim();
    const sortOrder = parseInt((form.get('sort_order') as string | null) ?? '0') || 0;
    const active = form.get('active') === 'on';

    if (isNaN(id) || !href || !scope) {
      return fail(422, { error: 'URL and scope are required.' });
    }

    await locals.db.withUser(async (tx) => {
      await tx
        .update(navigationItem)
        .set({ href, scope, sortOrder, active })
        .where(eq(navigationItem.id, id));
    });

    return { success: true };
  },

  updateText: async ({ params, request, locals }) => {
    const navId = parseInt(params.id);
    const form = await request.formData();

    const localeId = parseInt(form.get('locale_id') as string);
    const content = (form.get('content') as string | null)?.trim() ?? '';

    if (isNaN(navId) || isNaN(localeId)) return fail(422, { error: 'Invalid parameters.' });

    // Read nav item then upsert text — one transaction since the read informs the write.
    await locals.db.withUser(async (tx) => {
      const [item] = await tx
        .select({ localTextLinkId: navigationItem.localTextLinkId })
        .from(navigationItem)
        .where(eq(navigationItem.id, navId))
        .limit(1);

      if (!item?.localTextLinkId) throw new Error('Navigation item not found.');

      await tx
        .insert(localText)
        .values({ link: item.localTextLinkId, locale: localeId, content })
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
      const [item] = await tx
        .select({ localTextLinkId: navigationItem.localTextLinkId })
        .from(navigationItem)
        .where(eq(navigationItem.id, id))
        .limit(1);

      await tx.delete(navigationItem).where(eq(navigationItem.id, id));

      if (item?.localTextLinkId) {
        await tx.delete(localText).where(eq(localText.link, item.localTextLinkId));
        await tx.delete(localTextLink).where(eq(localTextLink.id, item.localTextLinkId));
      }
    });

    throw redirect(303, '/admin/navigation-item');
  },
};
