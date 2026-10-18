<!-- Every stock level, with the actions an operator takes on one: adjust it, or open its
     adjustment history. -->
<script lang="ts">
  import './stock-level-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Badge, Button, DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { StockLevelRow } from '@sveltebuilder/logistic/views';

  type Props = {
    stockLevels: StockLevelRow[];
    /** Whether the list is filtered to low stock, which changes what an empty list says. */
    lowOnly: boolean;
    /** Opens the adjustment form for a row. Omitted for a reader who may not adjust stock. */
    onAdjust?: (stockLevel: StockLevelRow) => void;
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { stockLevels, lowOnly, onAdjust, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  // $derived, so the labels follow a locale switch like every other string on the page.
  const columns: DataTableColumn[] = $derived([
    { key: 'sku', label: localText('logistic.field.sku') },
    { key: 'location', label: localText('logistic.field.storage_location') },
    { key: 'onHand', label: localText('logistic.field.on_hand'), align: 'end' },
    { key: 'reserved', label: localText('logistic.field.reserved'), align: 'end' },
    { key: 'available', label: localText('logistic.field.available'), align: 'end' },
    { key: 'reorderPoint', label: localText('logistic.field.reorder_point'), align: 'end' },
    { key: 'actions', label: '' },
  ]);
</script>

{#snippet stockLevelCell(row: StockLevelRow, column: DataTableColumn)}
  {#if column.key === 'sku'}
    <span class="stock-level-table__sku">{row.sku}</span>
  {:else if column.key === 'location'}
    {dictionary.localText('name', 'storage_location', row.storageLocation.id)}
  {:else if column.key === 'onHand'}
    {row.onHand}
  {:else if column.key === 'reserved'}
    {row.reserved}
  {:else if column.key === 'available'}
    {#if row.reorderPoint !== null && row.available <= row.reorderPoint}
      <Badge variant="warning" size="sm">{row.available}</Badge>
    {:else}
      {row.available}
    {/if}
  {:else if column.key === 'reorderPoint'}
    {row.reorderPoint ?? '—'}
  {:else if column.key === 'actions'}
    <span class="stock-level-table__actions">
      {#if onAdjust}
        <Button variant="ghost" size="sm" onclick={() => onAdjust(row)}>
          {localText('logistic.stock_level.adjust')}
        </Button>
      {/if}
      <Button variant="ghost" size="sm" href="?history={row.id}">
        {localText('logistic.stock_level.history')}
      </Button>
    </span>
  {/if}
{/snippet}

<DataTable
  {columns}
  rows={stockLevels}
  rowKey={(row) => row.id}
  cell={stockLevelCell}
  labels={{
    empty: lowOnly ? localText('logistic.stock_level.empty_low') : localText('logistic.stock_level.empty'),
    pagination: globalDictionary.localText('navigation.pagination'),
    previousPage: globalDictionary.localText('pagination.previous'),
    nextPage: globalDictionary.localText('pagination.next'),
  }}
/>
