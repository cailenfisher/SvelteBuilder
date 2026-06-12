import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { DictionaryPayload } from '@sveltebuilder/hermes'

type GetDictionaryRow = {
  link_id: number;
  slug: string;
  scope: string | null;
  entity_id: number | null;
  content: string;
  locale_code: string;
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { locale: localeCode } = params
  const defaultCode = url.searchParams.get('fallback') ?? locals.defaultLocale.code

  const { data, error } = await locals.supabase.rpc('get_dictionary', {
    user_locale_code: localeCode,
    fallback_locale_code: defaultCode,
    scope_filter: null,
    entity_id_filter: null
  })

  if (error) {
    console.error('[local-text] global query error:', error)
    return json([] satisfies DictionaryPayload, { status: 200 })
  }

  const payload: DictionaryPayload = ((data ?? []) as GetDictionaryRow[]).map((row) => ({
    link: {
      id: row.link_id,
      slug: row.slug,
      scope: row.scope,
      entityId: row.entity_id
    },
    content: row.content,
    localeCode: row.locale_code
  }))

  return json(payload)
}
