import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DictionaryPayload } from 'diglossia';
import { getDictionaryPayload } from '$lib/server/local-text';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { locale: localeCode } = params;
  const defaultCode = url.searchParams.get('fallback') ?? locals.defaultLocale.code;

  const { data: payload, error } = await getDictionaryPayload(locals.supabase, {
    localeCode,
    fallbackLocaleCode: defaultCode,
    scope: null,
    entityId: null,
  });

  if (error) {
    console.error('[local-text] global query error:', error);
    return json([] satisfies DictionaryPayload, { status: 200 });
  }

  return json(payload);
};
