<script lang="ts">
  import { InboundReceiptCard, InboundReceiptList, InboundReceiptSummary } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
  import { RECEIPTS, RECEIPT_LINES, SUPPLIERS, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="Partial, with a discrepancy">
  <div style:inline-size="min(100%, 28rem)">
    <InboundReceiptCard
      receipt={RECEIPTS[0]}
      supplier={SUPPLIERS[0]}
      lines={RECEIPT_LINES}
      href="#receipt-41"
      locale="en"
      {dictionary}
    />
  </div>
</Example>

<Example title="Pending">
  <div style:inline-size="min(100%, 28rem)">
    <InboundReceiptCard receipt={RECEIPTS[1]} supplier={SUPPLIERS[0]} locale="en" {dictionary} />
  </div>
</Example>

<Example title="Blind receipt (no supplier), complete">
  <div style:inline-size="min(100%, 28rem)">
    <InboundReceiptCard receipt={RECEIPTS[2]} supplier={null} locale="en" {dictionary} />
  </div>
</Example>

<Example title="InboundReceiptSummary: expected and received">
  <InboundReceiptSummary inboundReceipt={RECEIPTS[0]} locale="en" {dictionary} />
</Example>

<Example title="InboundReceiptList: linked cards, and the empty state">
  <div style:inline-size="min(100%, 28rem)">
    <InboundReceiptList
      inboundReceipts={RECEIPTS.map((receipt) => ({
        ...receipt,
        supplier: receipt.supplierId === null ? null : SUPPLIERS[0],
        lines: RECEIPT_LINES.filter((line) => line.inboundReceiptId === receipt.id),
      }))}
      href={(receipt) => `#receipt-${receipt.id}`}
      locale="en"
      emptyLabel="No receipts are waiting."
      {dictionary}
    />
  </div>
</Example>

<Example title="InboundReceiptList: empty">
  <InboundReceiptList inboundReceipts={[]} locale="en" emptyLabel="No receipts are waiting." {dictionary} />
</Example>
