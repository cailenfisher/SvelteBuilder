import { error, fail } from '@sveltejs/kit';
import { createDictionary } from 'diglossia';
import { validateArticleForPublish } from '@sveltebuilder/content/publishing';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import type { AdminArticleDetailView, ChecklistEntry } from '@sveltebuilder/content/views';
import type { Actions, PageServerLoad } from './$types';

const toOne = <T>(embed: T | T[] | null): T | null =>
  embed === null ? null : Array.isArray(embed) ? (embed[0] ?? null) : embed;

export const load: PageServerLoad = async ({ locals, params }): Promise<AdminArticleDetailView> => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [articleResult, statusesResult, checklistResult, stateResult, taxonomyResults] =
    await Promise.all([
      locals.supabase
        .from('article')
        .select(
          'id, article_status_id, canonical_slug, published_at, updated_at, deleted_at, embargo_until, allow_comment, created_at, article_status!inner(id, slug, ordinal), article_block(id, article_id, block_type, position, content, media_asset_id, created_at), article_byline(position, author_profile(id, user_account_id, slug, active, created_at)), article_section(section(id, parent_section_id, slug, ordinal, active, created_at)), article_topic(topic(id, slug, active, created_at)), article_tag(tag(id, slug, active, created_at))'
        )
        .eq('id', id)
        .maybeSingle(),
      locals.supabase.from('article_status').select('id, slug, ordinal').order('ordinal'),
      locals.supabase
        .from('publish_checklist_item')
        .select('id, slug, ordinal, required')
        .order('ordinal'),
      locals.supabase
        .from('article_checklist_state')
        .select('publish_checklist_item_id, satisfied')
        .eq('article_id', id),
      Promise.all([
        locals.supabase
          .from('section')
          .select('id, parent_section_id, slug, ordinal, active, created_at')
          .eq('active', true)
          .order('ordinal'),
        locals.supabase.from('topic').select('id, slug, active, created_at').eq('active', true),
        locals.supabase.from('tag').select('id, slug, active, created_at'),
      ]),
    ]);

  if (articleResult.error) throw error(500, 'Failed to load the article.');
  if (!articleResult.data) throw error(404, 'Article not found.');
  if (statusesResult.error) throw error(500, 'Failed to load statuses.');
  if (checklistResult.error) throw error(500, 'Failed to load the publish checklist.');
  if (stateResult.error) throw error(500, 'Failed to load the checklist state.');

  const [sectionsResult, topicsResult, tagsResult] = taxonomyResults;
  if (sectionsResult.error || topicsResult.error || tagsResult.error) {
    throw error(500, 'Failed to load taxonomy.');
  }

  const row = articleResult.data;
  const status = toOne(row.article_status);
  if (status === null) throw error(500, 'Article has no status.');

  const blocks = (row.article_block ?? [])
    .map((block) => ({
      id: block.id,
      articleId: block.article_id,
      blockType: block.block_type,
      position: block.position,
      content: block.content,
      mediaAssetId: block.media_asset_id,
      createdAt: block.created_at,
    }))
    .sort((a, b) => a.position - b.position);

  const bylines = (row.article_byline ?? [])
    .map((byline) => ({ position: byline.position, author: toOne(byline.author_profile) }))
    .filter(
      (byline): byline is { position: number; author: NonNullable<typeof byline.author> } =>
        byline.author !== null
    )
    .sort((a, b) => a.position - b.position)
    .map(({ author }) => ({
      id: author.id,
      userAccountId: author.user_account_id,
      slug: author.slug,
      active: author.active,
      createdAt: author.created_at,
    }));

  const sections = (row.article_section ?? [])
    .map((entry) => toOne(entry.section))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .map((entry) => ({
      id: entry.id,
      parentSectionId: entry.parent_section_id,
      slug: entry.slug,
      ordinal: entry.ordinal,
      active: entry.active,
      createdAt: entry.created_at,
    }));

  const topics = (row.article_topic ?? [])
    .map((entry) => toOne(entry.topic))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      active: entry.active,
      createdAt: entry.created_at,
    }));

  const tags = (row.article_tag ?? [])
    .map((entry) => toOne(entry.tag))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      active: entry.active,
      createdAt: entry.created_at,
    }));

  // An item with no state row is unsatisfied: never having ticked a box is the common case, not
  // a missing record, which is why this is a map lookup with a false default rather than a join.
  const satisfied = new Map(
    (stateResult.data ?? []).map((state) => [state.publish_checklist_item_id, state.satisfied])
  );

  const checklist: ChecklistEntry[] = (checklistResult.data ?? []).map((item) => ({
    id: item.id,
    slug: item.slug,
    ordinal: item.ordinal,
    required: item.required,
    completed: satisfied.get(item.id) ?? false,
  }));

  const [uiCopy, entityCopy] = await Promise.all([
    loadScopedCopy(locals.supabase, ['content'], locals.locale.code, locals.defaultLocale.code),
    loadEntityCopy(
      locals.supabase,
      [
        { scope: 'article', ids: [row.id] },
        { scope: 'article_block', ids: blocks.map((block) => block.id) },
        { scope: 'article_status', ids: (statusesResult.data ?? []).map((s) => s.id) },
        { scope: 'publish_checklist_item', ids: checklist.map((item) => item.id) },
        { scope: 'author_profile', ids: bylines.map((author) => author.id) },
        {
          scope: 'section',
          ids: (sectionsResult.data ?? []).map((section) => section.id),
        },
        { scope: 'topic', ids: (topicsResult.data ?? []).map((topic) => topic.id) },
        { scope: 'tag', ids: (tagsResult.data ?? []).map((tag) => tag.id) },
      ],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  return {
    article: {
      id: row.id,
      articleStatusId: row.article_status_id,
      canonicalSlug: row.canonical_slug,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      embargoUntil: row.embargo_until,
      allowComment: row.allow_comment,
      createdAt: row.created_at,
      status: { id: status.id, slug: status.slug, ordinal: status.ordinal },
      blocks,
      bylines,
      sections,
      topics,
      tags,
    },
    statuses: (statusesResult.data ?? []).map((s) => ({
      id: s.id,
      slug: s.slug,
      ordinal: s.ordinal,
    })),
    checklist,
    availableSections: (sectionsResult.data ?? []).map((section) => ({
      id: section.id,
      parentSectionId: section.parent_section_id,
      slug: section.slug,
      ordinal: section.ordinal,
      active: section.active,
      createdAt: section.created_at,
    })),
    availableTopics: (topicsResult.data ?? []).map((topic) => ({
      id: topic.id,
      slug: topic.slug,
      active: topic.active,
      createdAt: topic.created_at,
    })),
    availableTags: (tagsResult.data ?? []).map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      active: tag.active,
      createdAt: tag.created_at,
    })),
    localeCode: locals.locale.code,
    copy: [...uiCopy, ...entityCopy],
  };
};

export const actions: Actions = {
  // Moving through the workflow. Two gates, deliberately in different places.
  //
  // The required-checklist gate is in content_transition_article_status, because it must not be
  // bypassable by posting this form directly. The editorial checks — a headline inside Google's
  // length limit, a dek, a byline, a section, text in every prose block, alt text on every image
  // — run here, because they need a dictionary to resolve the copy and the answer depends on
  // which locale is being published. SQL has no dictionary.
  transition: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();
    const statusSlug = (form.get('status_slug') as string | null)?.trim();
    if (!statusSlug) return fail(422, { error: 'Choose a status.' });

    if (statusSlug === 'published') {
      const { article, publisher, copy } = await loadArticleForValidation(locals, id);
      if (article === null) throw error(404, 'Article not found.');

      try {
        validateArticleForPublish(article, publisher, createDictionary(copy));
      } catch (validationError) {
        return fail(422, {
          error:
            validationError instanceof Error
              ? validationError.message
              : 'This article is not ready to publish.',
        });
      }
    }

    const { error: rpcError } = await locals.supabase.rpc('content_transition_article_status', {
      p_article_id: id,
      p_status_slug: statusSlug,
    });

    if (rpcError) {
      if (rpcError.code === '42501') {
        return fail(403, { error: 'Not permitted to change this article’s status.' });
      }
      // The function raises with the unsatisfied item slugs, which is more useful to an editor
      // than a generic failure.
      return fail(422, { error: rpcError.message });
    }

    return { success: true as const };
  },

  // One upsert. The unique index on (article_id, publish_checklist_item_id) is what makes this a
  // single statement rather than a read-then-insert-or-update.
  checklist: async ({ locals, params, request }) => {
    const articleId = Number(params.id);
    if (!Number.isInteger(articleId)) throw error(404, 'Not found.');

    const form = await request.formData();
    const itemId = Number(form.get('item_id'));
    const satisfied = form.get('satisfied') === 'true';

    if (!Number.isInteger(itemId)) return fail(422, { error: 'Invalid checklist item.' });

    const { error: upsertError } = await locals.supabase.from('article_checklist_state').upsert(
      {
        article_id: articleId,
        publish_checklist_item_id: itemId,
        satisfied,
        satisfied_at: satisfied ? new Date().toISOString() : null,
      },
      { onConflict: 'article_id,publish_checklist_item_id' }
    );

    if (upsertError) return fail(500, { error: 'Failed to update the checklist.' });

    return { success: true as const };
  },
};

/**
 * Re-reads what validateArticleForPublish needs. Separate from the page load because a form
 * action does not get the loader's data, and because what it needs is narrower: the blocks and
 * relations, plus the publisher, plus enough copy to resolve a headline and every block's text.
 */
async function loadArticleForValidation(locals: App.Locals, id: number) {
  const [articleResult, publisherResult] = await Promise.all([
    locals.supabase
      .from('article')
      .select(
        'id, article_status_id, canonical_slug, published_at, updated_at, deleted_at, embargo_until, allow_comment, created_at, article_block(id, article_id, block_type, position, content, media_asset_id, created_at), article_byline(position, author_profile(id, user_account_id, slug, active, created_at)), article_section(section(id, parent_section_id, slug, ordinal, active, created_at)), article_topic(topic(id, slug, active, created_at)), article_tag(tag(id, slug, active, created_at))'
      )
      .eq('id', id)
      .maybeSingle(),
    locals.supabase
      .from('publisher_profile')
      .select('id, logo_media_asset_id, url, created_at')
      .limit(1)
      .maybeSingle(),
  ]);

  if (articleResult.error || !articleResult.data) {
    return { article: null, publisher: null, copy: [] };
  }

  const row = articleResult.data;

  const blocks = (row.article_block ?? [])
    .map((block) => ({
      id: block.id,
      articleId: block.article_id,
      blockType: block.block_type,
      position: block.position,
      content: block.content,
      mediaAssetId: block.media_asset_id,
      createdAt: block.created_at,
    }))
    .sort((a, b) => a.position - b.position);

  const article = {
    id: row.id,
    articleStatusId: row.article_status_id,
    canonicalSlug: row.canonical_slug,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    embargoUntil: row.embargo_until,
    allowComment: row.allow_comment,
    createdAt: row.created_at,
    blocks,
    bylines: (row.article_byline ?? [])
      .map((byline) => toOne(byline.author_profile))
      .filter((author): author is NonNullable<typeof author> => author !== null)
      .map((author) => ({
        id: author.id,
        userAccountId: author.user_account_id,
        slug: author.slug,
        active: author.active,
        createdAt: author.created_at,
      })),
    sections: (row.article_section ?? [])
      .map((entry) => toOne(entry.section))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({
        id: entry.id,
        parentSectionId: entry.parent_section_id,
        slug: entry.slug,
        ordinal: entry.ordinal,
        active: entry.active,
        createdAt: entry.created_at,
      })),
    topics: (row.article_topic ?? [])
      .map((entry) => toOne(entry.topic))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        active: entry.active,
        createdAt: entry.created_at,
      })),
    tags: (row.article_tag ?? [])
      .map((entry) => toOne(entry.tag))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        active: entry.active,
        createdAt: entry.created_at,
      })),
  };

  const mediaAssetIds = blocks
    .map((block) => block.mediaAssetId)
    .filter((assetId): assetId is number => assetId !== null);

  const copy = await loadEntityCopy(
    locals.supabase,
    [
      { scope: 'article', ids: [article.id] },
      { scope: 'article_block', ids: blocks.map((block) => block.id) },
      { scope: 'media_asset', ids: mediaAssetIds },
      { scope: 'publisher_profile', ids: publisherResult.data ? [publisherResult.data.id] : [] },
    ],
    locals.locale.code,
    locals.defaultLocale.code
  );

  return {
    article,
    publisher: publisherResult.data
      ? {
          id: publisherResult.data.id,
          logoMediaAssetId: publisherResult.data.logo_media_asset_id,
          url: publisherResult.data.url,
          createdAt: publisherResult.data.created_at,
        }
      : null,
    copy,
  };
}
