<!-- What a shipment carries: each line's SKU and quantity. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { ShipmentLine } from '../schema/index.js';

  type Props = {
    shipmentLines: ShipmentLine[];
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { shipmentLines, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

{#if shipmentLines.length > 0}
  <Table class={['shipment-line-table', extraClass ?? ''].filter(Boolean).join(' ')}>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{localText('logistic.field.sku')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.shipment.quantity')}</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {#each shipmentLines as line (line.id)}
        <TableRow>
          <TableCell><code class="shipment-line-table__sku">{line.sku}</code></TableCell>
          <TableCell>{line.quantity}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
{:else}
  <p class="shipment-line-table__empty">{localText('logistic.shipment.lines_empty')}</p>
{/if}
