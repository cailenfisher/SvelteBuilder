<!-- The receipt's lines: what was expected where, what arrived, and the difference. While the
     receipt is open, each line can be received from its row. -->
<script lang="ts">
  import './inbound-receipt-line-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { InboundReceiptLine } from '@sveltebuilder/logistic';
  import InboundReceiptLineReceiveForm from './InboundReceiptLineReceiveForm.svelte';

  type Props = {
    inboundReceiptLines: InboundReceiptLine[];
    /** Whether the receipt still accepts receiving, which adds the receive column. */
    receivable: boolean;
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { inboundReceiptLines, receivable, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

{#if inboundReceiptLines.length > 0}
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{localText('logistic.field.sku')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.field.storage_location')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.inbound_receipt.expected_quantity')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.inbound_receipt.received_quantity')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.inbound_receipt.discrepancy')}</TableHeaderCell>
        {#if receivable}
          <TableHeaderCell>{localText('logistic.inbound_receipt.receive')}</TableHeaderCell>
        {/if}
      </TableRow>
    </TableHead>
    <TableBody>
      {#each inboundReceiptLines as line (line.id)}
        <TableRow>
          <TableCell><code class="inbound-receipt-line-table__sku">{line.sku}</code></TableCell>
          <TableCell>
            {dictionary.localText('name', 'storage_location', line.storageLocationId)}
          </TableCell>
          <TableCell>{line.expectedQuantity}</TableCell>
          <TableCell>{line.receivedQuantity}</TableCell>
          <TableCell>
            {#if line.discrepancy !== 0}
              <span
                class="inbound-receipt-line-table__discrepancy"
                class:inbound-receipt-line-table__discrepancy--negative={line.discrepancy < 0}
              >
                {line.discrepancy > 0 ? '+' : ''}{line.discrepancy}
              </span>
            {:else}
              —
            {/if}
          </TableCell>
          {#if receivable}
            <TableCell>
              <InboundReceiptLineReceiveForm inboundReceiptLine={line} {dictionary} />
            </TableCell>
          {/if}
        </TableRow>
      {/each}
    </TableBody>
  </Table>
{:else}
  <p class="inbound-receipt-line-table__empty">{localText('logistic.inbound_receipt.lines_empty')}</p>
{/if}
