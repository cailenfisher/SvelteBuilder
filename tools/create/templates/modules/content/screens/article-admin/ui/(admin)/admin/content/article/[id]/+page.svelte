<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import './article-admin-detail-screen.css';
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import { ArticleBlockEditor, ArticleWorkflowPanel } from '@sveltebuilder/content';
  import { RoleAssignmentPanel } from '@sveltebuilder/access';
  import type { ArticleAdminDetailView } from '@sveltebuilder/content/views';
  import type { RoleAssignmentPanelView, RoleAssignmentRow } from '@sveltebuilder/access/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import ArticleAdminDetailHeader from './ArticleAdminDetailHeader.svelte';
  import ArticleRoleAssignmentCreateForm from './ArticleRoleAssignmentCreateForm.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  // The access panel's data is the access package's, beside this module's view: null when the
  // reader may not share the article.
  let { data, form }: {
    data: ArticleAdminDetailView & { access: RoleAssignmentPanelView | null };
    form?: ScreenFormResult;
  } = $props();

  const globalDictionary = getDictionary();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'content');

  const article = $derived(data.article);
  const headline = $derived(scoped.localText('headline', 'article', article.id));

  // Only the controls that will work. Editing (status changes short of publishing, the checklist)
  // takes `update`; moving to or from `published` takes `publish`. RLS and the transition
  // function refuse the rest regardless.
  const actions = $derived(data.actions ?? []);
  const editable = $derived(actions.includes('update'));
  const publishable = $derived(actions.includes('publish'));
  const transitionStatuses = $derived(
    publishable
      ? data.statuses
      : article.status.slug === 'published'
        ? data.statuses.filter((status) => status.slug === 'published')
        : data.statuses.filter((status) => status.slug !== 'published')
  );
</script>

{#snippet removeAccess(roleAssignment: RoleAssignmentRow)}
  <form method="POST" action="?/unshare">
    <input type="hidden" name="role_assignment_id" value={roleAssignment.id} />
    <Button type="submit" variant="secondary" size="sm">{globalDictionary.localText('action.remove')}</Button>
  </form>
{/snippet}

<svelte:head>
  <title>{headline}</title>
</svelte:head>

<div class="article-admin-detail-screen">
  <ArticleAdminDetailHeader {article} dictionary={scoped} />

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, globalDictionary)} detail={form.error.detail} />
  {/if}

  <div class="article-admin-detail-screen__columns">
    <section class="article-admin-detail-screen__section" aria-label={localText('content.article_admin.body')}>
      <h2 class="article-admin-detail-screen__section-title">{localText('content.article_admin.body')}</h2>

      <ArticleBlockEditor blocks={article.blocks} readonly dictionary={scoped} />

      <h2 class="article-admin-detail-screen__section-title">{localText('content.article_admin.filing')}</h2>
      <dl class="article-admin-detail-screen__filing">
        <div>
          <dt class="article-admin-detail-screen__filing-term">{localText('content.article_admin.section')}</dt>
          <dd class="article-admin-detail-screen__filing-value">
            {article.sections.length > 0
              ? article.sections
                  .map((section) => scoped.localText('name', 'section', section.id))
                  .join(', ')
              : '—'}
          </dd>
        </div>
        <div>
          <dt class="article-admin-detail-screen__filing-term">{localText('content.article_admin.article_byline')}</dt>
          <dd class="article-admin-detail-screen__filing-value">
            {article.bylines.length > 0
              ? article.bylines
                  .map((author) => scoped.localText('name', 'author_profile', author.id))
                  .join(', ')
              : '—'}
          </dd>
        </div>
      </dl>
    </section>

    {#if editable || publishable}
      <ArticleWorkflowPanel
        statusSlug={article.status.slug}
        statuses={transitionStatuses}
        checklist={data.checklist}
        transitionAction="?/transition"
        checklistAction="?/checklist"
        {enhance}
        dictionary={scoped}
      />
    {/if}
  </div>

  {#if data.access}
    {@const access = data.access}
    <RoleAssignmentPanel
      roleAssignments={access.roleAssignments}
      locale={data.localeCode}
      removeAction={removeAccess}
      dictionary={scoped}
    >
      {#snippet addForm()}
        <ArticleRoleAssignmentCreateForm
          userAccounts={access.userAccounts}
          userGroups={access.userGroups}
          roles={access.roles}
          dictionary={scoped}
        />
      {/snippet}
    </RoleAssignmentPanel>
  {/if}
</div>
