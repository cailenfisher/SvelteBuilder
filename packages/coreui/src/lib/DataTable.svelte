<!-- DataTable: filterable, sortable, paginated wrapper around Table primitives.
     Camp 1 — i18n-agnostic. Caller provides column definitions and data.
     Generic over row type T. -->
<script lang="ts" generics="T extends Record<string, unknown>">
  import { Table, TableHead, TableBody, TableFoot, TableRow, TableHeader, TableCell, Pagination, Skeleton } from './index.js';
  import type { Snippet } from 'svelte';

  type SortDirection = 'asc' | 'desc' | null;

  export type Column<Row> = {
    key: string;
    label: string;
    sortable?: boolean;
    render?: Snippet<[Row]>;
    class?: string;
  };

  type Props = {
    columns: Column<T>[];
    rows: T[];
    total?: number;
    page?: number;
    perPage?: number;
    loading?: boolean;
    emptyMessage?: string;
    onPageChange?: (page: number) => void;
    onSort?: (key: string, direction: SortDirection) => void;
    sortKey?: string;
    sortDirection?: SortDirection;
    class?: string | undefined;
  };

  let {
    columns,
    rows,
    total = rows.length,
    page = 1,
    perPage = 20,
    loading = false,
    emptyMessage = 'No results.',
    onPageChange,
    onSort,
    sortKey,
    sortDirection = null,
    class: extraClass,
  }: Props = $props();

  function handleSort(key: string, sortable?: boolean) {
    if (!sortable || !onSort) return;
    const nextDir: SortDirection =
      sortKey === key
        ? sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
        : 'asc';
    onSort(key, nextDir);
  }

  const totalPages = $derived(Math.ceil(total / perPage));
</script>

<div class={['data-table-wrap', extraClass ?? ''].filter(Boolean).join(' ')} role="region" aria-label="Data table" aria-live="polite">
  <Table class="data-table">
    <TableHead>
      <TableRow>
        {#each columns as col (col.key)}
          <TableHeader
            class={['data-table-th', col.sortable ? 'sortable' : '', col.key === sortKey ? 'sorted' : '', col.class ?? ''].filter(Boolean).join(' ')}
            aria-sort={col.key === sortKey ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : undefined}
          >
            {#if col.sortable}
              <button
                class="sort-btn"
                onclick={() => handleSort(col.key, col.sortable)}
                aria-label={`Sort by ${col.label}`}
              >
                {col.label}
                <span class="sort-icon" aria-hidden="true">
                  {#if col.key === sortKey && sortDirection === 'asc'}↑{:else if col.key === sortKey && sortDirection === 'desc'}↓{:else}↕{/if}
                </span>
              </button>
            {:else}
              {col.label}
            {/if}
          </TableHeader>
        {/each}
      </TableRow>
    </TableHead>

    <TableBody>
      {#if loading}
        {#each { length: perPage } as _, i (i)}
          <TableRow>
            {#each columns as col (col.key)}
              <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            {/each}
          </TableRow>
        {/each}
      {:else if rows.length === 0}
        <TableRow>
          <TableCell colspan={columns.length} class="data-table-empty">
            {emptyMessage}
          </TableCell>
        </TableRow>
      {:else}
        {#each rows as row, i (i)}
          <TableRow>
            {#each columns as col (col.key)}
              <TableCell class={col.class}>
                {#if col.render}
                  {@render col.render(row)}
                {:else}
                  {row[col.key] ?? ''}
                {/if}
              </TableCell>
            {/each}
          </TableRow>
        {/each}
      {/if}
    </TableBody>

    {#if totalPages > 1}
      <TableFoot>
        <TableRow>
          <TableCell colspan={columns.length} class="data-table-foot">
            <Pagination
              {page}
              {totalPages}
              onPageChange={(p) => onPageChange?.(p)}
            />
          </TableCell>
        </TableRow>
      </TableFoot>
    {/if}
  </Table>
</div>

<style>
  .data-table-wrap {
    width: 100%;
    overflow-x: auto;
  }
</style>
