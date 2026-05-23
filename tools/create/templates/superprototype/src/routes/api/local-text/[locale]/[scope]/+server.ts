import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { DictionaryPayload } from '@sveltebuilder/hermes'

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { locale: localeCode, scope } = params
  const defaultCode = url.searchParams.get('fallback') ?? locals.defaultLocale.code

  const { data, error } = await locals.supabase.rpc('get_dictionary', {
    user_locale_code: localeCode,
    fallback_locale_code: defaultCode,
    scope_filter: scope,
    entity_id_filter: null
  })

  if (error) {
    console.error(`[local-text] scope query error (${scope}):`, error)
    return json([] satisfies DictionaryPayload, { status: 200 })
  }

  const payload: DictionaryPayload = (data ?? []).map((row: any) => ({
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
