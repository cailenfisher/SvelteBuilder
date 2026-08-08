<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { ArticleView, ArticleWorkflowPanel } from '@sveltebuilder/content';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  const mediaAssets = $derived(
    new Map(
      (data.article.blocks ?? [])
        .filter((b: any) => b.mediaAsset != null)
        .map((b: any) => [BigInt(b.mediaAssetId!), b.mediaAsset!]),
    ),
  );

  let workflowOpen = $state(false);

  function openWorkflow() { workflowOpen = true; }
  function closeWorkflow() { workflowOpen = false; }

  async function transitionStatus(statusSlug: string) {
    const fd = new FormData();
    fd.set('status_slug', statusSlug);
    await fetch(`?/transition`, { method: 'POST', body: fd });
    window.location.reload();
  }

  async function toggleChecklist(itemId: number, satisfied: boolean) {
    const fd = new FormData();
    fd.set('item_id', String(itemId));
    fd.set('satisfied', String(satisfied));
    await fetch(`?/checklist`, { method: 'POST', body: fd });
  }
</script>

<svelte:head>
  <title>[Admin] {data.article.headline} — Content</title>
</svelte:head>

<div class="admin-article-detail">
  <header class="admin-article-detail__bar">
    <a href="/admin/content/article" class="admin-article-detail__back">← Articles</a>
    <span class="admin-article-detail__status">{data.article.status?.label ?? data.article.article_status?.slug}</span>
    <button class="admin-article-detail__workflow-btn" onclick={openWorkflow}>
      Workflow
    </button>
  </header>

  <ArticleView
    article={data.article}
    {mediaAssets}
    storageBaseUrl={data.storageBaseUrl}
    locale={data.locale.code}
  />
</div>

<ArticleWorkflowPanel
  article={data.article}
  assignments={data.article.article_assignment ?? []}
  checklistItems={data.checklistItems}
  checklistStates={data.article.article_checklist_state ?? []}
  open={workflowOpen}
  onClose={closeWorkflow}
  onTransitionStatus={transitionStatus}
  onChecklistToggle={toggleChecklist}
  locale={data.locale.code}
/>

<style>
  .admin-article-detail {
    max-width: 80rem;
    margin-inline: auto;
    padding: var(--space-4) var(--space-4) var(--space-12);
  }

  .admin-article-detail__bar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding-block: var(--space-4);
    margin-block-end: var(--space-6);
    border-block-end: 1px solid var(--border-color);
  }

  .admin-article-detail__back {
    font-size: var(--text-sm);
    color: var(--text-soft);
    text-decoration: none;
  }

  .admin-article-detail__back:hover { color: var(--text); }

  .admin-article-detail__status {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--brand);
    margin-inline-start: auto;
  }

  .admin-article-detail__workflow-btn {
    appearance: none;
    background: var(--brand);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
  }

  .admin-article-detail__workflow-btn:hover {
    background: color-mix(in srgb, var(--brand), black 15%);
  }
</style>
