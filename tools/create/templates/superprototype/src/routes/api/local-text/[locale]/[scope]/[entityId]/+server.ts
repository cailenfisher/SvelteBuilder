import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DictionaryPayload } from 'diglossia';
import { getDictionaryPayload } from '$lib/server/local-text';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { locale: localeCode, scope, entityId } = params;
  const defaultCode = url.searchParams.get('fallback') ?? locals.defaultLocale.code;
  const entityIdNumber = parseInt(entityId, 10);

  if (isNaN(entityIdNumber)) {
    return json([] satisfies DictionaryPayload, { status: 200 });
  }

  const { data: payload, error } = await getDictionaryPayload(locals.supabase, {
    localeCode,
    fallbackLocaleCode: defaultCode,
    scope: scope,
    entityId: entityIdNumber,
  });

  if (error) {
    console.error(`[local-text] entity query error (${scope}/${entityId}):`, error);
    return json([] satisfies DictionaryPayload, { status: 200 });
  }

  return json(payload);
};
