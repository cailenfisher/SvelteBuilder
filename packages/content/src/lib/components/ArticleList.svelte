<!-- Camp 1: no hermes import — receives pre-resolved headline strings from server.
     Uses coreui DataTable for sortable, paginated article management. -->
<script lang="ts">
  import { DataTable } from '@sveltebuilder/coreui';
  import type { Column } from '@sveltebuilder/coreui';
  import type { ArticleWithCopy } from '../schema/index.js';

  type Props = {
    articles: ArticleWithCopy[];
    total: number;
    page: number;
    perPage: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onRowClick?: (article: ArticleWithCopy) => void;
    locale: string;
  };

  let {
    articles,
    total,
    page,
    perPage,
    loading = false,
    onPageChange,
    onRowClick,
    locale,
  }: Props = $props();

  type ArticleRow = {
    id: number;
    headline: string;
    status: string;
    section: string;
    publishedAt: string | null;
    bylines: string;
    _article: ArticleWithCopy;
  };

  const rows: ArticleRow[] = $derived(
    articles.map((a) => ({
      id: a.id,
      headline: a.headline,
      status: a.status.label,
      section: a.sections?.[0]?.name ?? '—',
      publishedAt: a.publishedAt
        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(a.publishedAt))
        : null,
      bylines: a.bylines?.map((b) => b.name).join(', ') ?? '—',
      _article: a,
    })),
  );

  const columns: Column<ArticleRow>[] = [
    { key: 'headline', label: 'Headline', sortable: true },
    { key: 'bylines',  label: 'Author',   sortable: false },
    { key: 'section',  label: 'Section',  sortable: true },
    { key: 'status',   label: 'Status',   sortable: true },
    { key: 'publishedAt', label: 'Published', sortable: true },
  ];

  function handleRowClick(row: ArticleRow) {
    onRowClick?.(row._article);
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
  emptyMessage="No articles found."
/>
