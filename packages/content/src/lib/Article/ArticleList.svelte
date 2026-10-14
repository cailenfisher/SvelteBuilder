<!-- Camp 2: receives pre-resolved headline strings from the server, and resolves its own column
     and table copy (scope `content`) from the dictionary.
     Uses coreui DataTable for paginated article management. Sort/filter is a
     server-side concern (load function); this component only reports intent. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
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
    dictionary?: DictionaryInstance;
  };

  let {
    articles,
    total,
    page,
    perPage,
    onPageChange,
    onRowClick,
    locale,
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const columns: DataTableColumn[] = $derived([
    { key: 'headline', label: dictionary.localText('content.article_list.headline', 'content') },
    { key: 'bylines', label: dictionary.localText('content.article_list.author', 'content') },
    { key: 'section', label: dictionary.localText('content.article_list.section', 'content') },
    { key: 'status', label: dictionary.localText('content.article_list.status', 'content') },
    { key: 'publishedAt', label: dictionary.localText('content.article_list.published_at', 'content') },
  ]);

  const tableLabels = $derived({
    empty: dictionary.localText('content.article_list.empty', 'content'),
    pagination: dictionary.localText('content.pagination.label', 'content'),
    previousPage: dictionary.localText('content.pagination.previous', 'content'),
    nextPage: dictionary.localText('content.pagination.next', 'content'),
  });

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
  {columns}
  rows={articles}
  rowKey={(article) => article.id}
  cell={articleCell}
  {page}
  {perPage}
  {total}
  onPageChange={onPageChange ?? (() => {})}
  labels={tableLabels}
/>
