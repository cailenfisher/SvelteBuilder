<script lang="ts">
  import { DataTable, Pagination, type DataTableColumn } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  type Supplier = { id: number; name: string; country: string; openReceipts: number };

  const suppliers: Supplier[] = Array.from({ length: 23 }, (_, index) => ({
    id: index + 1,
    name: `Supplier ${String(index + 1).padStart(2, '0')}`,
    country: ['France', 'Canada', 'Japan', 'Brazil'][index % 4],
    openReceipts: (index * 7) % 11,
  }));

  const columns: DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'country', label: 'Country', sortable: true },
    { key: 'openReceipts', label: 'Open receipts', sortable: true, align: 'end' },
  ];

  const perPage = 8;

  const labels = {
    empty: 'No suppliers.',
    pagination: 'Supplier pages',
    previousPage: 'Previous page',
    nextPage: 'Next page',
  };
  let page = $state(1);
  let sortKey = $state('name');
  let sortDirection = $state<'asc' | 'desc'>('asc');

  const sorted = $derived(
    [...suppliers].sort((a, b) => {
      const key = sortKey as keyof Supplier;
      const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
      return sortDirection === 'asc' ? order : -order;
    })
  );
  const visible = $derived(sorted.slice((page - 1) * perPage, page * perPage));

  let standalonePage = $state(3);

  const sortCalls: [string, 'asc' | 'desc'][] = $state([]);
  const pageCalls: number[] = $state([]);
</script>

{#snippet supplierCell(supplier: Supplier, column: DataTableColumn)}
  {#if column.key === 'name'}
    <a href={`#supplier-${supplier.id}`}>{supplier.name}</a>
  {:else if column.key === 'country'}
    {supplier.country}
  {:else}
    {supplier.openReceipts}
  {/if}
{/snippet}

<Example title="Sorted and paged">
  <div style:inline-size="100%">
    <DataTable
      caption="Suppliers"
      {columns}
      rows={visible}
      rowKey={(supplier) => supplier.id}
      cell={supplierCell}
      {sortKey}
      {sortDirection}
      onSortChange={(key, direction) => {
        sortCalls.push([key, direction]);
        sortKey = key;
        sortDirection = direction;
        page = 1;
      }}
      bind:page
      onPageChange={(next) => pageCalls.push(next)}
      {perPage}
      total={suppliers.length}
      labels={{ ...labels, empty: 'No suppliers.' }}
    />
    <CallbackLog name="onSortChange" calls={sortCalls} />
    <CallbackLog name="onPageChange" calls={pageCalls} />
    <p role="status">Page {page}, sorted by {sortKey} {sortDirection}</p>
  </div>
</Example>

<Example title="Empty">
  <div style:inline-size="100%">
    <DataTable
      caption="Suppliers matching “zzz”"
      {columns}
      rows={[] as Supplier[]}
      rowKey={(supplier) => supplier.id}
      cell={supplierCell}
      labels={{ ...labels, empty: 'No suppliers match.' }}
    />
  </div>
</Example>

<Example title="Pagination on its own">
  <Pagination
    count={240}
    perPage={10}
    bind:page={standalonePage}
    label="Receipt pages"
    previousLabel="Previous page"
    nextLabel="Next page"
  />
  <p role="status">Page {standalonePage}</p>
</Example>
