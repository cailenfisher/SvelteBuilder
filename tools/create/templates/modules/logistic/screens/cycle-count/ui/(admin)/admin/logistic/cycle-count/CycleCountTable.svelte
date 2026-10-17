<!-- One page of cycle counts with their progress, each linking to its detail screen. -->
<script lang="ts">
  import './cycle-count-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Badge, DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { CycleCountStatus } from '@sveltebuilder/logistic';
  import type { CycleCountRow } from '@sveltebuilder/logistic/views';

  type Props = {
    cycleCounts: CycleCountRow[];
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    localeCode: string;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { cycleCounts, page, perPage, total, onPageChange, localeCode, dictionary }: Props =
    $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: localText('logistic.cycle_count.one') },
    { key: 'status', label: localText('logistic.cycle_count.status_label') },
    { key: 'progress', label: localText('logistic.cycle_count.progress'), align: 'end' },
    { key: 'createdAt', label: localText('logistic.cycle_count.created_at') },
  ]);

  // Badge takes a variant, not a domain status: mapping the one to the other is the
  // caller's job by design, since only the domain knows which states are good news.
  const statusVariant = (status: CycleCountStatus) =>
    status === 'completed'
      ? 'success'
      : status === 'in_progress'
        ? 'warning'
        : status === 'cancelled'
          ? 'danger'
          : 'default';

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet cycleCountCell(row: CycleCountRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/cycle-count/{row.id}" class="cycle-count-table__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <Badge variant={statusVariant(row.status)}>
      {localText(`logistic.cycle_count.status.${row.status}`)}
    </Badge>
  {:else if column.key === 'progress'}
    <!-- Interpolated through MF2 so a locale can order the two numbers as its grammar
         needs, rather than the screen hardcoding "x of y". -->
    {dictionary.formatText(
      'logistic.cycle_count.progress_value',
      { counted: row.countedCount, total: row.lineCount },
      'logistic'
    )}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<DataTable
  {columns}
  rows={cycleCounts}
  rowKey={(row) => row.id}
  cell={cycleCountCell}
  {page}
  {perPage}
  {total}
  {onPageChange}
  labels={{
    empty: localText('logistic.cycle_count.empty'),
    pagination: globalDictionary.localText('navigation.pagination'),
    previousPage: globalDictionary.localText('pagination.previous'),
    nextPage: globalDictionary.localText('pagination.next'),
  }}
/>
