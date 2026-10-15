<script lang="ts">
  import './article-admin-detail-screen.css';
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import { ArticleBlockEditor, ArticleWorkflowPanel } from '@sveltebuilder/content';
  import type { ArticleAdminDetailView } from '@sveltebuilder/content/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import ArticleAdminDetailHeader from './ArticleAdminDetailHeader.svelte';

  let { data, form }: { data: ArticleAdminDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'content');

  const article = $derived(data.article);
  const headline = $derived(scoped.localText('headline', 'article', article.id));
</script>

<svelte:head>
  <title>{headline}</title>
</svelte:head>

<div class="article-admin-detail-screen">
  <ArticleAdminDetailHeader {article} dictionary={scoped} />

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <div class="article-admin-detail-screen__columns">
    <section class="article-admin-detail-screen__section" aria-label={t('content.article_admin.body')}>
      <h2 class="article-admin-detail-screen__section-title">{t('content.article_admin.body')}</h2>

      <ArticleBlockEditor blocks={article.blocks} readonly dictionary={scoped} />

      <h2 class="article-admin-detail-screen__section-title">{t('content.article_admin.filing')}</h2>
      <dl class="article-admin-detail-screen__filing">
        <div>
          <dt class="article-admin-detail-screen__filing-term">{t('content.article_admin.section')}</dt>
          <dd class="article-admin-detail-screen__filing-value">
            {article.sections.length > 0
              ? article.sections
                  .map((section) => scoped.localText('name', 'section', section.id))
                  .join(', ')
              : '—'}
          </dd>
        </div>
        <div>
          <dt class="article-admin-detail-screen__filing-term">{t('content.article_admin.article_byline')}</dt>
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

    <ArticleWorkflowPanel
      statusSlug={article.status.slug}
      statuses={data.statuses}
      checklist={data.checklist}
      transitionAction="?/transition"
      checklistAction="?/checklist"
      {enhance}
      dictionary={scoped}
    />
  </div>
</div>
