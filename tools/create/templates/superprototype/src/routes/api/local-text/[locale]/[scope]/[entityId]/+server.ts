import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DictionaryPayload } from 'diglossia';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { locale: localeCode, scope, entityId } = params;
  const defaultCode = url.searchParams.get('fallback') ?? locals.defaultLocale.code;
  const entityIdNumber = parseInt(entityId, 10);

  if (isNaN(entityIdNumber)) {
    return json([] satisfies DictionaryPayload, { status: 200 });
  }

  const { data, error } = await locals.supabase.rpc('get_dictionary', {
    user_locale_code: localeCode,
    fallback_locale_code: defaultCode,
    scope_filter: scope,
    entity_id_filter: entityIdNumber,
  });

  if (error) {
    console.error(`[local-text] entity query error (${scope}/${entityId}):`, error);
    return json([] satisfies DictionaryPayload, { status: 200 });
  }

  const payload: DictionaryPayload = (data ?? []).map((row) => ({
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
};
