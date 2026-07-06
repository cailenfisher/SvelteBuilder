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
    // Right-align numeric columns (quantities, amounts).
    align?: 'left' | 'right';
  };
</script>

<script lang="ts" generics="Row">
  import type { Snippet } from 'svelte';
  import Table from './Table.svelte';
  import TableHead from './TableHead.svelte';
  import TableBody from './TableBody.svelte';
  import TableRow from './TableRow.svelte';
  import TableHeader from './TableHeader.svelte';
  import TableCell from './TableCell.svelte';
  import Pagination from './Pagination.svelte';

  type Props = {
    columns: DataTableColumn[];
    rows: Row[];
    rowKey: (row: Row) => string | number;
    cell: Snippet<[Row, DataTableColumn]>;
    caption?: string;
    stickyHeader?: boolean;
    emptyLabel?: string;
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
    emptyLabel = 'No data',
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
          <TableHeader
            sortable={column.sortable === true && onSortChange !== undefined}
            sorted={sortKey === column.key ? sortDirection : false}
            onSort={column.sortable && onSortChange ? () => handleSort(column) : undefined}
            class={column.align === 'right' ? 'align-right' : undefined}
          >
            {column.label}
          </TableHeader>
        {/each}
      </TableRow>
    </TableHead>
    <TableBody>
      {#if rows.length === 0}
        <TableRow>
          <TableCell colspan={columns.length} class="empty">{emptyLabel}</TableCell>
        </TableRow>
      {:else}
        {#each rows as row (rowKey(row))}
          <TableRow>
            {#each columns as column (column.key)}
              <TableCell class={column.align === 'right' ? 'align-right' : undefined}>
                {@render cell(row, column)}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      {/if}
    </TableBody>
  </Table>

  {#if total !== undefined && total > perPage}
    <div class="footer">
      <Pagination count={total} {perPage} bind:page {onPageChange} />
    </div>
  {/if}
</div>
