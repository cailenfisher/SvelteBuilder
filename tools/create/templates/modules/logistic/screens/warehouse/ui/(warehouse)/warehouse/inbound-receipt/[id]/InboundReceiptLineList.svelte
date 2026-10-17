<!-- The receipt's lines grouped by location, each recording what arrived through this route's
     `receive` action. A line received in full is dimmed. -->
<script lang="ts">
  import './inbound-receipt-line-list.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Input } from '@sveltebuilder/coreui';
  import type { InboundReceiptLineRow } from '@sveltebuilder/logistic/views';

  type Props = {
    inboundReceiptLines: InboundReceiptLineRow[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { inboundReceiptLines, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<ol class="inbound-receipt-line-list">
  {#each inboundReceiptLines as line (line.id)}
    <li class="inbound-receipt-line-list__line" class:inbound-receipt-line-list__line--done={line.receivedQuantity >= line.expectedQuantity}>
      <div class="inbound-receipt-line-list__line-where">
        <!-- Where it goes, first and largest: the receiver is putting goods away. -->
        <span class="inbound-receipt-line-list__location">
          {dictionary.localText('name', 'storage_location', line.storageLocationId)}
        </span>
        <code class="inbound-receipt-line-list__sku">{line.sku}</code>
      </div>

      <div class="inbound-receipt-line-list__line-what">
        <span class="inbound-receipt-line-list__quantity">
          {dictionary.formatText(
            'logistic.warehouse.inbound_receipt.received_of',
            { received: line.receivedQuantity, expected: line.expectedQuantity },
            'logistic'
          )}
        </span>

        <form method="POST" action="?/receive" class="inbound-receipt-line-list__form" use:enhance>
          <input type="hidden" name="inbound_receipt_line_id" value={line.id} />
          <!-- No max: receiving more than expected is a real event, and the discrepancy
               column exists to record it. That is the difference from picking, where the
               reservation caps what may be taken. -->
          <Input
            name="quantity"
            type="number"
            min="0"
            value={String(line.receivedQuantity)}
            aria-label={localText('logistic.inbound_receipt.received_quantity')}
          />
          <Button type="submit" variant="primary" size="sm">
            {localText('logistic.inbound_receipt.receive')}
          </Button>
        </form>
      </div>

      {#if line.discrepancy !== 0}
        <p class="inbound-receipt-line-list__discrepancy">
          {dictionary.formatText(
            'logistic.warehouse.inbound_receipt.discrepancy_note',
            { discrepancy: line.discrepancy },
            'logistic'
          )}
        </p>
      {/if}
    </li>
  {/each}
</ol>
