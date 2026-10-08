<script lang="ts">
  import { ReceiptCard } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';
  import { RECEIPTS, RECEIPT_LINES, SUPPLIERS, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="Partial, with a discrepancy">
  <div style:inline-size="min(100%, 28rem)">
    <ReceiptCard receipt={RECEIPTS[0]} supplier={SUPPLIERS[0]} lines={RECEIPT_LINES} href="#receipt-41" locale="en" {dictionary} />
  </div>
</Example>

<Example title="Pending">
  <div style:inline-size="min(100%, 28rem)">
    <ReceiptCard receipt={RECEIPTS[1]} supplier={SUPPLIERS[0]} locale="en" {dictionary} />
  </div>
</Example>

<Example title="Blind receipt (no supplier), complete">
  <div style:inline-size="min(100%, 28rem)">
    <ReceiptCard receipt={RECEIPTS[2]} supplier={null} locale="en" {dictionary} />
  </div>
</Example>
