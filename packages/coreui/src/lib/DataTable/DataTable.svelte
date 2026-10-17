<!-- DataTable: controlled, server-side table. The parent owns the data, the
     sort state, and the page — this component renders and reports intent via
     callbacks. Client-side sorting/filtering is deliberately out of scope:
     sort/filter/paginate in the load function, pass the slice in as rows. -->
<script module lang="ts">
  export type DataTableColumn = {
    // Column identifier, passed back through onSortChange and the cell snippet.
    key: string;
    label: string;
    sortable?: boolean;
    // Align numeric columns (quantities, amounts) to the end of the line: the right in
    // left-to-right text, the left in right-to-left.
    align?: 'start' | 'end';
  };

  /** Every string the table renders around its rows. All are required: there is no English default. */
  export type DataTableLabels = {
    /** Shown in place of rows when there are none. */
    empty: string;
    /** Accessible name of the pagination landmark. */
    pagination: string;
    previousPage: string;
    nextPage: string;
  };
</script>

<script lang="ts" generics="Row">
  import type { Snippet } from 'svelte';
  import Table from '../Table/Table.svelte';
  import TableHead from '../Table/TableHead.svelte';
  import TableBody from '../Table/TableBody.svelte';
  import TableRow from '../Table/TableRow.svelte';
  import TableHeaderCell from '../Table/TableHeaderCell.svelte';
  import TableCell from '../Table/TableCell.svelte';
  import Pagination from '../Pagination/Pagination.svelte';

  type Props = {
    columns: DataTableColumn[];
    rows: Row[];
    rowKey: (row: Row) => string | number;
    cell: Snippet<[Row, DataTableColumn]>;
    caption?: string;
    stickyHeader?: boolean;
    labels: DataTableLabels;
    // Controlled sort. Headers are only interactive when onSortChange is given.
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
    // Server-side pagination. The footer renders when total exceeds perPage.
    page?: number;
    perPage?: number;
    total?: number;
    onPageChange?: (page: number) => void;
    class?: string | undefined;
  };

  let {
    columns,
    rows,
    rowKey,
    cell,
    caption,
    stickyHeader = false,
    labels,
    sortKey,
    sortDirection = 'asc',
    onSortChange,
    page = $bindable(1),
    perPage = 20,
    total,
    onPageChange,
    class: extraClass,
  }: Props = $props();

  function handleSort(column: DataTableColumn) {
    if (!onSortChange) return;
    const direction = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(column.key, direction);
  }

  const classes = $derived(
    ['data-table', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={classes}>
  <Table {caption} {stickyHeader}>
    <TableHead>
      <TableRow>
        {#each columns as column (column.key)}
          <TableHeaderCell
            sortable={column.sortable === true && onSortChange !== undefined}
            sorted={sortKey === column.key ? sortDirection : false}
            onSort={column.sortable && onSortChange ? () => handleSort(column) : undefined}
            class={column.align === 'end' ? 'table-cell--end' : undefined}
          >
            {column.label}
          </TableHeaderCell>
        {/each}
      </TableRow>
    </TableHead>
    <TableBody>
      {#if rows.length === 0}
        <TableRow>
          <TableCell colspan={columns.length} class="data-table__empty">{labels.empty}</TableCell>
        </TableRow>
      {:else}
        {#each rows as row (rowKey(row))}
          <TableRow>
            {#each columns as column (column.key)}
              <TableCell class={column.align === 'end' ? 'table-cell--end' : undefined}>
                {@render cell(row, column)}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      {/if}
    </TableBody>
  </Table>

  {#if total !== undefined && total > perPage}
    <div class="data-table__footer">
      <Pagination
        count={total}
        {perPage}
        bind:page
        {onPageChange}
        label={labels.pagination}
        previousLabel={labels.previousPage}
        nextLabel={labels.nextPage}
      />
    </div>
  {/if}
</div>
