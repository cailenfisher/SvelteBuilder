<!-- Camp 1: no hermes import — receives pre-resolved headline strings from server.
     Uses coreui DataTable for paginated article management. Sort/filter is a
     server-side concern (load function); this component only reports intent. -->
<script lang="ts">
  import { DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ArticleWithCopy } from '../schema/index.js';

  type Props = {
    articles: ArticleWithCopy[];
    total: number;
    page: number;
    perPage: number;
    onPageChange?: (page: number) => void;
    onRowClick?: (article: ArticleWithCopy) => void;
    locale: string;
  };

  let {
    articles,
    total,
    page,
    perPage,
    onPageChange,
    onRowClick,
    locale,
  }: Props = $props();

  const columns: DataTableColumn[] = [
    { key: 'headline', label: 'Headline' },
    { key: 'bylines', label: 'Author' },
    { key: 'section', label: 'Section' },
    { key: 'status', label: 'Status' },
    { key: 'publishedAt', label: 'Published' },
  ];

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet articleCell(article: ArticleWithCopy, column: DataTableColumn)}
  {#if column.key === 'headline'}
    {#if onRowClick}
      <button type="button" class="article-list__row-link" onclick={() => onRowClick?.(article)}>
        {article.headline}
      </button>
    {:else}
      {article.headline}
    {/if}
  {:else if column.key === 'bylines'}
    {article.bylines?.map((b) => b.name).join(', ') ?? '—'}
  {:else if column.key === 'section'}
    {article.sections?.[0]?.name ?? '—'}
  {:else if column.key === 'status'}
    {article.status.label}
  {:else if column.key === 'publishedAt'}
    {article.publishedAt ? formatDate(article.publishedAt) : '—'}
  {/if}
{/snippet}

<DataTable
  columns={columns}
  rows={articles}
  rowKey={(article) => article.id}
  cell={articleCell}
  {page}
  {perPage}
  {total}
  onPageChange={onPageChange ?? (() => {})}
  emptyLabel="No articles found."
/>

<style>
  .article-list__row-link {
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--color-text-link);
    cursor: pointer;
    text-align: left;
  }

  .article-list__row-link:hover {
    text-decoration: underline;
  }
</style>
