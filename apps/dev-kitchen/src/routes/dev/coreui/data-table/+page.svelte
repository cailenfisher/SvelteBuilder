<script lang="ts">
  import { DataTable, Pagination, type DataTableColumn } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

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
    { key: 'openReceipts', label: 'Open receipts', sortable: true, align: 'right' },
  ];

  const perPage = 8;
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
        sortKey = key;
        sortDirection = direction;
        page = 1;
      }}
      bind:page
      {perPage}
      total={suppliers.length}
    />
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
      emptyLabel="No suppliers match."
    />
  </div>
</Example>

<Example title="Pagination on its own">
  <Pagination count={240} perPage={10} bind:page={standalonePage} label="Receipt pages" />
  <p role="status">Page {standalonePage}</p>
</Example>
