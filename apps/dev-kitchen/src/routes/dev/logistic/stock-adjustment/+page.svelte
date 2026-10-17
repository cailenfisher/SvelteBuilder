<script lang="ts">
  import { StockAdjustmentList } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
  import { STOCK_ADJUSTMENTS, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="A removal and a receipt, newest first">
  <StockAdjustmentList stockAdjustments={STOCK_ADJUSTMENTS} locale="en" {dictionary} />
</Example>

<Example title="No adjustments yet">
  <StockAdjustmentList stockAdjustments={[]} locale="en" {dictionary} />
</Example>
