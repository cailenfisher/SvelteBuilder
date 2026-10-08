<script lang="ts">
  import { TrackingEventList } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';
  import { TRACKING_EVENTS } from '$lib/fixtures/logistic';
</script>

<Example title="Shipment 4182">
  <TrackingEventList events={TRACKING_EVENTS} locale="en" />
</Example>

<Example title="No events yet">
  <TrackingEventList events={[]} locale="en" />
</Example>
