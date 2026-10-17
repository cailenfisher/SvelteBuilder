<!-- Receives pre-resolved article copy from the server, and resolves its own column,
     role and table copy (scope `content`) from the dictionary.
     Uses coreui DataTable for article assignment queue management. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ArticleAssignment, ArticleWithCopy } from '../../schema/index.js';

  type ArticleAssignmentWithArticle = ArticleAssignment & {
    article: ArticleWithCopy;
    assigneeName: string;
  };

  type Props = {
    assignments: ArticleAssignmentWithArticle[];
    total: number;
    page: number;
    perPage: number;
    onPageChange?: (page: number) => void;
    onRowClick?: (assignment: ArticleAssignmentWithArticle) => void;
    locale: string;
    dictionary?: DictionaryInstance;
  };

  let {
    assignments,
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
    { key: 'headline', label: dictionary.localText('content.article_assignment_queue.article', 'content') },
    { key: 'role', label: dictionary.localText('content.article_assignment_queue.role', 'content') },
    { key: 'assignee', label: dictionary.localText('content.article_assignment_queue.assignee', 'content') },
    { key: 'status', label: dictionary.localText('content.article_assignment_queue.status', 'content') },
    { key: 'dueAt', label: dictionary.localText('content.article_assignment_queue.due_at', 'content') },
  ]);

  const tableLabels = $derived({
    empty: dictionary.localText('content.article_assignment_queue.empty', 'content'),
    pagination: dictionary.localText('content.pagination.label', 'content'),
    previousPage: dictionary.localText('content.pagination.previous', 'content'),
    nextPage: dictionary.localText('content.pagination.next', 'content'),
  });

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet assignmentCell(assignment: ArticleAssignmentWithArticle, column: DataTableColumn)}
  {#if column.key === 'headline'}
    {#if onRowClick}
      <button
        type="button"
        class="article-assignment-queue__row-link"
        onclick={() => onRowClick?.(assignment)}
      >
        {assignment.article.headline}
      </button>
    {:else}
      {assignment.article.headline}
    {/if}
  {:else if column.key === 'role'}
    {dictionary.localText(`content.article_assignment_role.${assignment.role}`, 'content')}
  {:else if column.key === 'assignee'}
    {assignment.assigneeName}
  {:else if column.key === 'status'}
    {assignment.article.status.label}
  {:else if column.key === 'dueAt'}
    {assignment.dueAt ? formatDate(assignment.dueAt) : '—'}
  {/if}
{/snippet}

<DataTable
  {columns}
  rows={assignments}
  rowKey={(assignment) => assignment.id}
  cell={assignmentCell}
  {page}
  {perPage}
  {total}
  onPageChange={onPageChange ?? (() => {})}
  labels={tableLabels}
/>
