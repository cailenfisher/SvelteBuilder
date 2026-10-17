<script lang="ts">
  import { LogisticMetricSummary } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
  import { logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="A busy morning">
  <LogisticMetricSummary
    metrics={{
      pendingInboundReceiptCount: 4,
      openPickTaskCount: 12,
      openReturnAuthorizationCount: 2,
      openCycleCountCount: 1,
      lowStockCount: 3,
    }}
    {dictionary}
  />
</Example>
