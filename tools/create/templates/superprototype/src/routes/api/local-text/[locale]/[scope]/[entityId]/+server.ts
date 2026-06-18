import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import type { DictionaryPayload } from '@sveltebuilder/hermes';
import { db } from '$lib/server/db/client';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { locale: localeCode, scope, entityId } = params;
  const defaultCode = url.searchParams.get('fallback') ?? locals.defaultLocale.code;
  const entityIdNumber = parseInt(entityId, 10);

  if (isNaN(entityIdNumber)) {
    return json([] satisfies DictionaryPayload, { status: 200 });
  }

  try {
    const rows = await db.execute<{
      link_id: number;
      slug: string;
      scope: string | null;
      entity_id: number | null;
      content: string;
      locale_code: string;
    }>(sql`
      select * from public.get_dictionary(
        ${localeCode},
        ${defaultCode},
        ${scope},
        ${entityIdNumber}
      )
    `);

    const payload: DictionaryPayload = rows.map((row) => ({
      link: {
        id: Number(row.link_id),
        slug: row.slug,
        scope: row.scope,
        entityId: row.entity_id !== null ? Number(row.entity_id) : null,
      },
      content: row.content,
      localeCode: row.locale_code,
    }));

    return json(payload);
  } catch (err) {
    console.error(`[local-text] entity query error (${scope}/${entityId}):`, err);
    return json([] satisfies DictionaryPayload, { status: 200 });
  }
};
