import { error } from '@sveltejs/kit';
import { createDictionary } from 'diglossia';
import { validateArticleForPublish, type ImageProvenance } from '@sveltebuilder/content/publishing';
import { loadEntityCopy, loadScopedCopy } from '$lib/server/scoped-copy';
import { getArticle, transitionArticleStatus } from '$lib/server/content/article';
import {
  listArticleChecklistState,
  saveArticleChecklistState,
} from '$lib/server/content/article-checklist-state';
import { listArticleStatus } from '$lib/server/content/article-status';
import { listMediaAssetRights } from '$lib/server/content/media-asset-rights';
import { listMediaAssetSource } from '$lib/server/content/media-asset-source';
import { listPublishChecklistItem } from '$lib/server/content/publish-checklist-item';
import { getPublisherProfile } from '$lib/server/content/publisher-profile';
import { listActiveSection } from '$lib/server/content/section';
import { listTag } from '$lib/server/content/tag';
import { listActiveTopic } from '$lib/server/content/topic';
import {
  createArticleRoleAssignment,
  deleteArticleRoleAssignment,
  listArticleAccess,
  listArticlePrincipal,
} from '$lib/server/content/article-role-assignment';
import { listScopeRole } from '$lib/server/role';
import type { ArticleAdminDetailView, ArticleChecklistEntry } from '@sveltebuilder/content/views';
import type { RoleAssignmentPanelView } from '@sveltebuilder/access/views';
import type { Actions, PageServerLoad } from './$types';
import { formError, postgrestFormError } from '$lib/server/form-error';
import { loadArticleAction, requireArticleScope } from '../article-action';

export const load: PageServerLoad = async ({
  locals,
  params,
  parent,
}): Promise<ArticleAdminDetailView & { access: RoleAssignmentPanelView | null }> => {
  await requireArticleScope(parent);

  const id = Number(params.id);
  if (!Number.isInteger(id)) throw error(404, 'Not found.');

  const [
    articleResult,
    statusesResult,
    checklistResult,
    stateResult,
    sectionsResult,
    topicsResult,
    tagsResult,
  ] = await Promise.all([
    getArticle(locals.supabase, id),
    listArticleStatus(locals.supabase),
    listPublishChecklistItem(locals.supabase),
    listArticleChecklistState(locals.supabase, id),
    listActiveSection(locals.supabase),
    listActiveTopic(locals.supabase),
    listTag(locals.supabase),
  ]);

  if (articleResult.error) throw error(500, 'Failed to load the article.');
  if (!articleResult.data) throw error(404, 'Article not found.');
  if (statusesResult.error) throw error(500, 'Failed to load statuses.');
  if (checklistResult.error) throw error(500, 'Failed to load the publish checklist.');
  if (stateResult.error) throw error(500, 'Failed to load the checklist state.');
  if (sectionsResult.error || topicsResult.error || tagsResult.error) {
    throw error(500, 'Failed to load taxonomy.');
  }

  const article = articleResult.data;
  const actions = (await loadArticleAction(locals.supabase, [article.id])).get(article.id) ?? [];

  // The access panel, only for a reader who may share the article. Its functions refuse anyone
  // else, so asking would fail rather than show nothing.
  let access: RoleAssignmentPanelView | null = null;
  if (actions.includes('share')) {
    const [accessResult, principalResult, roleResult] = await Promise.all([
      listArticleAccess(locals.supabase, article.id),
      listArticlePrincipal(locals.supabase, article.id),
      listScopeRole(locals.supabase, 'article'),
    ]);
    if (accessResult.error || principalResult.error || roleResult.error) {
      throw error(500, 'Failed to load who has access.');
    }
    access = {
      roleAssignments: accessResult.data,
      userAccounts: principalResult.data.userAccounts,
      userGroups: principalResult.data.userGroups,
      roles: roleResult.data,
    };
  }

  // An item with no state row is unsatisfied: never having ticked a box is the common case, not
  // a missing record, which is why this is a map lookup with a false default rather than a join.
  const satisfied = new Map(
    stateResult.data.map((state) => [state.publishChecklistItemId, state.satisfied])
  );

  const checklist: ArticleChecklistEntry[] = checklistResult.data.map((item) => ({
    id: item.id,
    slug: item.slug,
    position: item.position,
    required: item.required,
    completed: satisfied.get(item.id) ?? false,
  }));

  const [uiCopy, entityCopy] = await Promise.all([
    loadScopedCopy(
      locals.supabase,
      access ? ['content', 'access', 'role', 'user_group'] : ['content'],
      locals.locale.code,
      locals.defaultLocale.code
    ),
    loadEntityCopy(
      locals.supabase,
      [
        { scope: 'article', ids: [article.id] },
        { scope: 'article_block', ids: article.blocks.map((block) => block.id) },
        { scope: 'article_status', ids: statusesResult.data.map((s) => s.id) },
        { scope: 'publish_checklist_item', ids: checklist.map((item) => item.id) },
        { scope: 'author_profile', ids: article.bylines.map((author) => author.id) },
        { scope: 'section', ids: sectionsResult.data.map((section) => section.id) },
        { scope: 'topic', ids: topicsResult.data.map((topic) => topic.id) },
        { scope: 'tag', ids: tagsResult.data.map((tag) => tag.id) },
      ],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  return {
    article,
    statuses: statusesResult.data,
    checklist,
    availableSections: sectionsResult.data,
    availableTopics: topicsResult.data,
    availableTags: tagsResult.data,
    localeCode: locals.locale.code,
    copy: [...uiCopy, ...entityCopy],
    actions,
    access,
  };
};

export const actions: Actions = {
  // Moving through the workflow. Two gates, deliberately in different places.
  //
  // The required-checklist gate is in content_transition_article_status, because it must not be
  // bypassable by posting this form directly. The editorial checks — a headline inside Google's
  // length limit, a dek, a byline, a section, text in every prose block, and on every image alt
  // text, rights, a source, an unexpired license and a credit in this locale — run here, because they need a dictionary to resolve the copy and the answer depends on
  // which locale is being published. SQL has no dictionary.
  transition: async ({ locals, params, request }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) throw error(404, 'Not found.');

    const form = await request.formData();
    const statusSlug = (form.get('status_slug') as string | null)?.trim();
    if (!statusSlug) return formError(422, 'content.error.status_required');

    if (statusSlug === 'published') {
      const validation = await loadArticleForValidation(locals, id);
      if (validation === null) throw error(404, 'Article not found.');

      const dictionary = createDictionary(validation.copy);
      const issues = validateArticleForPublish(validation.article, validation.publisher, dictionary, {
        imageProvenance: validation.imageProvenance,
        locale: locals.locale.code,
      });
      if (issues.length > 0) {
        // Every reason at once, in the editor's language, so they can fix the whole list.
        const detail = issues
          .map((issue) => dictionary.formatText(issue.slug, issue.values, 'content'))
          .join(' ');
        return formError(422, 'content.error.not_ready_to_publish', detail);
      }
    }

    const { error: rpcError } = await transitionArticleStatus(locals.supabase, id, statusSlug);

    if (rpcError) {
      if (rpcError.code === '42501') {
        return formError(403, 'content.error.status_change_forbidden');
      }
      // The function raises with the unsatisfied item slugs, which is more useful to an editor
      // than a generic failure, so its message travels as the detail.
      return formError(422, 'content.error.status_change_refused', rpcError.message);
    }

    return { success: true as const };
  },

  // Giving someone a role on this article. The function refuses anyone without `article.share` on
  // it, and anyone giving a role holding article permissions they lack themselves (A12).
  share: async ({ locals, params, request }) => {
    const articleId = Number(params.id);
    if (!Number.isInteger(articleId)) throw error(404, 'Not found.');

    const form = await request.formData();
    const roleId = Number(form.get('role_id'));
    const principal = (form.get('principal') as string | null) ?? '';
    const expiresAtInput = (form.get('expires_at') as string | null)?.trim() || null;
    const expiresAt = expiresAtInput === null ? null : new Date(`${expiresAtInput}Z`);

    // The picker submits `user_account:<id>` or `user_group:<id>`, so one field names either.
    const [kind, principalId] = principal.split(':');
    const principalNumber = Number(principalId);
    if (
      !Number.isInteger(roleId) ||
      !Number.isInteger(principalNumber) ||
      (kind !== 'user_account' && kind !== 'user_group') ||
      (expiresAt !== null && isNaN(expiresAt.getTime()))
    ) {
      return formError(422, 'access.error.role_assignment_input');
    }

    const { error: shareError } = await createArticleRoleAssignment(locals.supabase, {
      articleId,
      roleId,
      principal: kind === 'user_account' ? { userAccountId: principalNumber } : { userGroupId: principalNumber },
      expiresAt: expiresAt?.toISOString() ?? null,
    });
    if (shareError) {
      return postgrestFormError(shareError, 'access.error.role_assignment_failed', {
        '42501': 'access.error.share_refused',
        '23505': 'access.error.role_assignment_duplicate',
      });
    }
    return { success: true as const };
  },

  unshare: async ({ locals, request }) => {
    const roleAssignmentId = Number((await request.formData()).get('role_assignment_id'));
    if (!Number.isInteger(roleAssignmentId)) return formError(422, 'error.id_invalid');

    const { error: unshareError } = await deleteArticleRoleAssignment(locals.supabase, roleAssignmentId);
    if (unshareError) {
      return postgrestFormError(unshareError, 'access.error.role_assignment_failed', {
        '42501': 'access.error.share_refused',
      });
    }
    return { success: true as const };
  },

  checklist: async ({ locals, params, request }) => {
    const articleId = Number(params.id);
    if (!Number.isInteger(articleId)) throw error(404, 'Not found.');

    const form = await request.formData();
    const itemId = Number(form.get('item_id'));
    const satisfied = form.get('satisfied') === 'true';

    if (!Number.isInteger(itemId)) return formError(422, 'content.error.checklist_item_invalid');

    const { error: upsertError } = await saveArticleChecklistState(locals.supabase, {
      articleId,
      publishChecklistItemId: itemId,
      satisfied,
    });

    if (upsertError) return formError(500, 'content.error.checklist_update_failed');

    return { success: true as const };
  },
};

/**
 * Re-reads what validateArticleForPublish needs. Separate from the page load because a form
 * action does not get the loader's data, and because what it needs is narrower: the blocks and
 * relations, plus the publisher, plus enough copy to resolve a headline and every block's text.
 * Null when the article does not exist. A failed read throws a 500 rather than reaching the
 * validator, so an outage cannot read as "no rights recorded" and block a publish with a
 * misleading message about licensing.
 */
async function loadArticleForValidation(locals: App.Locals, id: number) {
  const [articleResult, publisherResult] = await Promise.all([
    getArticle(locals.supabase, id),
    getPublisherProfile(locals.supabase),
  ]);

  if (articleResult.error) throw error(500, 'Failed to load the article.');
  if (publisherResult.error) throw error(500, 'Failed to load the publisher profile.');
  if (articleResult.data === null) return null;

  const article = articleResult.data;
  const publisher = publisherResult.data;

  const mediaAssetIds = article.blocks
    .map((block) => block.mediaAssetId)
    .filter((assetId): assetId is number => assetId !== null);

  // Rights and source are readable with `media_asset.read`, which the seeded Editor holds along
  // with `article.publish`; the public page reads the media_asset_attribution view instead. A
  // custom role that may publish without reading media gets an empty read here, and validation
  // then reports the rights as missing rather than passing the image unchecked.
  const [rightsResult, sourceResult] = await Promise.all([
    listMediaAssetRights(locals.supabase, mediaAssetIds),
    listMediaAssetSource(locals.supabase, mediaAssetIds),
  ]);

  if (rightsResult.error) throw error(500, 'Failed to load media rights.');
  if (sourceResult.error) throw error(500, 'Failed to load media sources.');

  const imageProvenance = new Map<number, ImageProvenance>(
    mediaAssetIds.map((assetId) => {
      const rights = rightsResult.data.find((row) => row.mediaAssetId === assetId);
      const source = sourceResult.data.find((row) => row.mediaAssetId === assetId);
      return [
        assetId,
        {
          rights: rights
            ? {
                license: rights.license,
                creditRequired: rights.creditRequired,
                expiresAt: rights.expiresAt,
              }
            : null,
          source: source ? { sourceUrl: source.sourceUrl, licenseUrl: source.licenseUrl } : null,
        },
      ];
    })
  );

  // The module's UI copy too, for the validation messages.
  const [uiCopy, entityCopy] = await Promise.all([
    loadScopedCopy(locals.supabase, ['content'], locals.locale.code, locals.defaultLocale.code),
    loadEntityCopy(
      locals.supabase,
      [
        { scope: 'article', ids: [article.id] },
        { scope: 'article_block', ids: article.blocks.map((block) => block.id) },
        { scope: 'media_asset', ids: mediaAssetIds },
        { scope: 'publisher_profile', ids: publisher ? [publisher.id] : [] },
      ],
      locals.locale.code,
      locals.defaultLocale.code
    ),
  ]);

  return { article, publisher, copy: [...uiCopy, ...entityCopy], imageProvenance };
}
