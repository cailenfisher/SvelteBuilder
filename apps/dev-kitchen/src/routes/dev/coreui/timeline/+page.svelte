<script lang="ts">
  import { Timeline, TimelineItem } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';
</script>

<Example title="Shipment history">
  <Timeline>
    <TimelineItem timestamp="2026-10-05T08:12:00Z" label="Created">Order 4182 entered.</TimelineItem
    >
    <TimelineItem timestamp="2026-10-05T10:40:00Z" label="Picked"
      >All three lines picked.</TimelineItem
    >
    <TimelineItem timestamp="2026-10-06T07:02:00Z" label="Packed" current
      >Two cartons, 18.4 kg.</TimelineItem
    >
    <TimelineItem label="Dispatched">Awaiting carrier collection.</TimelineItem>
  </Timeline>
</Example>
