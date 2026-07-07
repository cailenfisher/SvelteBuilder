<!-- Camp 1: no hermes import — receives pre-resolved copy from server.
     Uses coreui DataTable for article assignment queue management. -->
<script lang="ts">
  import { DataTable, Badge } from '@sveltebuilder/coreui';
  import type { Column } from '@sveltebuilder/coreui';
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
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onRowClick?: (assignment: AssignmentWithArticle) => void;
    locale: string;
  };

  let {
    assignments,
    total,
    page,
    perPage,
    loading = false,
    onPageChange,
    onRowClick,
    locale,
  }: Props = $props();

  type QueueRow = {
    id: number;
    headline: string;
    role: string;
    assignee: string;
    dueAt: string | null;
    status: string;
    _assignment: AssignmentWithArticle;
  };

  const ROLE_LABEL: Record<string, string> = {
    author: 'Author',
    editor: 'Editor',
    photo:  'Photo',
    copy:   'Copy',
  };

  const rows: QueueRow[] = $derived(
    assignments.map((a) => ({
      id: a.id,
      headline: a.article.headline,
      role:     ROLE_LABEL[a.role] ?? a.role,
      assignee: a.assigneeName,
      dueAt: a.dueAt
        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(a.dueAt))
        : '—',
      status: a.article.status.label,
      _assignment: a,
    })),
  );

  const columns: Column<QueueRow>[] = [
    { key: 'headline', label: 'Article',  sortable: true },
    { key: 'role',     label: 'Role',     sortable: true },
    { key: 'assignee', label: 'Assignee', sortable: true },
    { key: 'status',   label: 'Status',   sortable: true },
    { key: 'dueAt',    label: 'Due',      sortable: true },
  ];

  function handleRowClick(row: QueueRow) {
    onRowClick?.(row._assignment);
  }
</script>

<DataTable
  data={rows}
  {columns}
  {total}
  {page}
  {perPage}
  {loading}
  onRowClick={handleRowClick}
  onPageChange={onPageChange ?? (() => {})}
  emptyMessage="No assignments in queue."
/>
