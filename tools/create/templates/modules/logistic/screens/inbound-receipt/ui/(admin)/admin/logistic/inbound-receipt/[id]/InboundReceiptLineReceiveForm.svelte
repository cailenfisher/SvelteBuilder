<!-- Records how much of one line arrived: posts to this route's `receiveInboundReceiptLine`
     action. -->
<script lang="ts">
  import './inbound-receipt-line-receive-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Input } from '@sveltebuilder/coreui';
  import type { InboundReceiptLine } from '@sveltebuilder/logistic';

  type Props = {
    inboundReceiptLine: InboundReceiptLine;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { inboundReceiptLine, dictionary }: Props = $props();
</script>

<form method="POST" action="?/receiveInboundReceiptLine" class="inbound-receipt-line-receive-form">
  <input type="hidden" name="inbound_receipt_line_id" value={inboundReceiptLine.id} />
  <Input
    name="received_quantity"
    type="number"
    min="0"
    value={String(inboundReceiptLine.receivedQuantity)}
    aria-label={dictionary.localText('logistic.inbound_receipt.received_quantity', 'logistic')}
  />
  <Button type="submit" variant="ghost" size="sm">
    {dictionary.localText('logistic.inbound_receipt.receive', 'logistic')}
  </Button>
</form>
