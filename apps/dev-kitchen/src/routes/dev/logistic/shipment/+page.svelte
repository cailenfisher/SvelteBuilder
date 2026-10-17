<script lang="ts">
  import { ShipmentLineTable } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
  import { SHIPMENT_LINES, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="Two lines">
  <ShipmentLineTable shipmentLines={SHIPMENT_LINES} {dictionary} />
</Example>

<Example title="No lines">
  <ShipmentLineTable shipmentLines={[]} {dictionary} />
</Example>
