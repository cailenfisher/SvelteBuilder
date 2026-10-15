<!-- Articles as a paginated table: headline, workflow status, canonical slug and creation date.
     Resolves headlines and status names (scopes `article`, `article_status`) and its own column
     copy (scope `content`) from the dictionary. Filtering and paging are the loader's concern;
     this component reports the page asked for and links each headline through `href`. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge, DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ArticleRow } from '../views.js';

  type Props = {
    articles: ArticleRow[];
    /** Where each headline links. */
    href: (article: ArticleRow) => string;
    total: number;
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    locale: string;
    dictionary?: DictionaryInstance;
  };

  let {
    articles,
    href,
    total,
    page,
    perPage,
    onPageChange,
    locale,
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const columns: DataTableColumn[] = $derived([
    { key: 'headline', label: dictionary.localText('content.article_list.headline', 'content') },
    { key: 'status', label: dictionary.localText('content.article_list.status', 'content') },
    { key: 'canonicalSlug', label: dictionary.localText('content.article_list.canonical_slug', 'content') },
    { key: 'createdAt', label: dictionary.localText('content.article_list.created_at', 'content') },
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

{#snippet articleCell(article: ArticleRow, column: DataTableColumn)}
  {#if column.key === 'headline'}
    <a href={href(article)} class="article-list__link">
      {dictionary.localText('headline', 'article', article.id)}
    </a>
  {:else if column.key === 'status'}
    <Badge variant={article.status.slug === 'published' ? 'success' : 'default'}>
      {dictionary.localText('name', 'article_status', article.status.id)}
    </Badge>
  {:else if column.key === 'canonicalSlug'}
    <code class="article-list__canonical-slug">{article.canonicalSlug}</code>
  {:else if column.key === 'createdAt'}
    {formatDate(article.createdAt)}
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
  {onPageChange}
  labels={tableLabels}
/>
