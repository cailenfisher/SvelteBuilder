<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { ArticleList } from '@sveltebuilder/content';
  import type { PageData } from './$types';
  import type { ArticleWithCopy } from '@sveltebuilder/content';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  function goToPage(page: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(page));
    window.location.href = url.toString();
  }

  function openArticle(article: ArticleWithCopy) {
    window.location.href = `/admin/content/article/${article.id}`;
  }
</script>

<svelte:head>
  <title>Articles — Content Admin</title>
</svelte:head>

<div class="admin-article-list">
  <header class="admin-article-list__header">
    <h1 class="admin-article-list__heading">Articles</h1>
    <a class="admin-article-list__new" href="/admin/content/article/new">New article</a>
  </header>

  <ArticleList
    articles={data.result.items}
    total={data.result.total}
    page={data.result.page}
    perPage={data.result.perPage}
    onPageChange={goToPage}
    onRowClick={openArticle}
    locale={data.locale.code}
  />
</div>

<style>
  .admin-article-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-8) var(--space-4);
    max-width: 80rem;
    margin-inline: auto;
  }

  .admin-article-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .admin-article-list__heading {
    margin: 0;
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--weight-bold);
    color: var(--text);
  }

  .admin-article-list__new {
    display: inline-flex;
    align-items: center;
    padding: var(--space-2) var(--space-4);
    background: var(--brand);
    color: white;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    text-decoration: none;
  }

  .admin-article-list__new:hover {
    background: color-mix(in srgb, var(--brand), black 15%);
  }
</style>
