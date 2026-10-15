<!-- One page of shipments, each linking to its detail screen. -->
<script lang="ts">
  import './shipment-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import { ShipmentStatusBadge } from '@sveltebuilder/logistic';
  import type { ShipmentRow } from '@sveltebuilder/logistic/views';

  type Props = {
    shipments: ShipmentRow[];
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    localeCode: string;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { shipments, page, perPage, total, onPageChange, localeCode, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: localText('logistic.shipment.one') },
    { key: 'status', label: localText('logistic.shipment.status_label') },
    { key: 'carrier', label: localText('logistic.field.carrier') },
    { key: 'trackingNumber', label: localText('logistic.field.tracking_number') },
    { key: 'lineCount', label: localText('logistic.shipment.lines'), align: 'end' },
    { key: 'createdAt', label: localText('logistic.shipment.created_at') },
  ]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet shipmentCell(row: ShipmentRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/shipment/{row.id}" class="shipment-table__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <ShipmentStatusBadge status={row.status} label={localText(`logistic.shipment.status.${row.status}`)} />
  {:else if column.key === 'carrier'}
    {row.carrier ?? '—'}
  {:else if column.key === 'trackingNumber'}
    {#if row.trackingNumber}
      <span class="shipment-table__tracking-number">{row.trackingNumber}</span>
    {:else}
      —
    {/if}
  {:else if column.key === 'lineCount'}
    {row.lineCount}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<DataTable
  {columns}
  rows={shipments}
  rowKey={(row) => row.id}
  cell={shipmentCell}
  {page}
  {perPage}
  {total}
  {onPageChange}
  labels={{
    empty: localText('logistic.shipment.empty'),
    pagination: globalDictionary.localText('navigation.pagination'),
    previousPage: globalDictionary.localText('pagination.previous'),
    nextPage: globalDictionary.localText('pagination.next'),
  }}
/>
