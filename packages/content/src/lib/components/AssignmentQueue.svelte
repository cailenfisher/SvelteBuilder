<!-- Camp 1: no hermes import — receives pre-resolved copy from server.
     Uses coreui DataTable for article assignment queue management. -->
<script lang="ts">
  import { DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ArticleAssignment, ArticleWithCopy } from '../schema/index.js';

  type AssignmentWithArticle = ArticleAssignment & {
    article: ArticleWithCopy;
    assigneeName: string;
  };

  type Props = {
    assignments: AssignmentWithArticle[];
    total: number;
    page: number;
    perPage: number;
    onPageChange?: (page: number) => void;
    onRowClick?: (assignment: AssignmentWithArticle) => void;
    locale: string;
  };

  let {
    assignments,
    total,
    page,
    perPage,
    onPageChange,
    onRowClick,
    locale,
  }: Props = $props();

  const ROLE_LABEL: Record<string, string> = {
    author: 'Author',
    editor: 'Editor',
    photo: 'Photo',
    copy: 'Copy',
  };

  const columns: DataTableColumn[] = [
    { key: 'headline', label: 'Article' },
    { key: 'role', label: 'Role' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'status', label: 'Status' },
    { key: 'dueAt', label: 'Due' },
  ];

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet assignmentCell(assignment: AssignmentWithArticle, column: DataTableColumn)}
  {#if column.key === 'headline'}
    {#if onRowClick}
      <button
        type="button"
        class="assignment-queue__row-link"
        onclick={() => onRowClick?.(assignment)}
      >
        {assignment.article.headline}
      </button>
    {:else}
      {assignment.article.headline}
    {/if}
  {:else if column.key === 'role'}
    {ROLE_LABEL[assignment.role] ?? assignment.role}
  {:else if column.key === 'assignee'}
    {assignment.assigneeName}
  {:else if column.key === 'status'}
    {assignment.article.status.label}
  {:else if column.key === 'dueAt'}
    {assignment.dueAt ? formatDate(assignment.dueAt) : '—'}
  {/if}
{/snippet}

<DataTable
  columns={columns}
  rows={assignments}
  rowKey={(assignment) => assignment.id}
  cell={assignmentCell}
  {page}
  {perPage}
  {total}
  onPageChange={onPageChange ?? (() => {})}
  emptyLabel="No assignments in queue."
/>

<style>
  .assignment-queue__row-link {
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--color-text-link);
    cursor: pointer;
    text-align: left;
  }

  .assignment-queue__row-link:hover {
    text-decoration: underline;
  }
</style>
