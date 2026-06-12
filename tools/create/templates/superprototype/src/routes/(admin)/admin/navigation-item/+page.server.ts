import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { navigationItem } from '$lib/server/schema';
import { localTextLink, localText } from '@sveltebuilder/hermes-schema/schema';

export const load: PageServerLoad = async ({ locals }) => {
  const navItems = await locals.db.withUser(async (tx) => {
    return tx
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
      .orderBy(asc(navigationItem.scope), asc(navigationItem.sortOrder));
  });

  return { navItems };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();

    const slug = (form.get('slug') as string | null)?.trim();
    const href = (form.get('href') as string | null)?.trim();
    const navScope = (form.get('nav_scope') as string | null)?.trim();
    const sortOrder = parseInt((form.get('sort_order') as string | null) ?? '0') || 0;

    if (!slug || !href || !navScope) {
      return fail(422, { error: 'Slug, URL, and scope are required.' });
    }

    // Insert link + nav item atomically — both must succeed or neither.
    await locals.db.withUser(async (tx) => {
      const [link] = await tx
        .insert(localTextLink)
        .values({ slug, scope: null, entityId: null })
        .returning({ id: localTextLink.id });

      if (!link) throw new Error('Failed to create copy link.');

      await tx
        .insert(navigationItem)
        .values({ localTextLinkId: link.id, href, scope: navScope, sortOrder });
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    const id = parseInt(form.get('id') as string);

    if (isNaN(id)) return fail(422, { error: 'Invalid ID.' });

    // Fetch the link ID, then delete nav item + its copy — all in one transaction.
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

    return { success: true };
  },
};
