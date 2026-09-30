import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
  buildArticleDictionaryPayload,
  updateArticle,
  transitionArticleStatus,
  setChecklistState,
  getChecklistState,
} from '@sveltebuilder/content/server';

// Supabase direct query for admin article detail (all statuses, not just published).
async function getAdminArticleById(
  supabase: App.Locals['supabase'],
  id: number,
  localeCode: string,
  defaultLocaleCode: string,
) {
  const { data } = await supabase
    .from('article')
    .select(`
      *,
      article_status(*),
      article_block(* order by position),
      article_byline(*, author_profile(*)),
      article_section(section(*)),
      article_topic(topic(*)),
      article_tag(tag(*)),
      article_assignment(*),
      article_checklist_state(*, publish_checklist_item(*))
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  return data;
}

async function getPublishChecklist(supabase: App.Locals['supabase']) {
  const { data } = await supabase
    .from('publish_checklist_item')
    .select('*')
    .order('ordinal');
  return data ?? [];
}

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.userAccountId) error(401, 'Unauthorized.');

  const { locale, defaultLocale } = locals;
  const id = Number(params.id);
  if (!id) error(400, 'Invalid article ID.');

  const [article, checklistItems] = await Promise.all([
    getAdminArticleById(locals.supabase, id, locale.code, defaultLocale.code),
    getPublishChecklist(locals.supabase),
  ]);

  if (!article) error(404, 'Article not found.');

  const dictionaryPayload = buildArticleDictionaryPayload(article as any, locale.code);

  return {
    article: article as any,
    checklistItems,
    dictionaryPayload,
  };
};

export const actions: Actions = {
  transition: async ({ locals, params, request }) => {
    if (!locals.userAccountId) error(401, 'Unauthorized.');

    const data     = await request.formData();
    const statusSlug = String(data.get('status_slug') ?? '');
    const id       = Number(params.id);

    await locals.db.withUser((tx) =>
      transitionArticleStatus(tx, id, statusSlug, locals.userAccountId!),
    );

    return { success: true };
  },

  checklist: async ({ locals, params, request }) => {
    if (!locals.userAccountId) error(401, 'Unauthorized.');

    const data      = await request.formData();
    const itemId    = Number(data.get('item_id'));
    const satisfied = data.get('satisfied') === 'true';
    const articleId = Number(params.id);

    await locals.db.withUser((tx) =>
      setChecklistState(tx, articleId, itemId, satisfied),
    );

    return { success: true };
  },
};
