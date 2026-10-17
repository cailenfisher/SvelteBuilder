<script lang="ts">
  import { TrackingEventList } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
  import { TRACKING_EVENTS, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="Shipment 4182">
  <TrackingEventList events={TRACKING_EVENTS} locale="en" {dictionary} />
</Example>

<Example title="No events yet">
  <TrackingEventList events={[]} locale="en" {dictionary} />
</Example>
