<script lang="ts">
  import { Button, Card, Divider, MetricCard } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';
</script>

<Example title="Card">
  <Card>
    <p>A card with only a body.</p>
  </Card>
  <Card as="article">
    {#snippet header()}<strong>Shipment 4182</strong>{/snippet}
    <p>Three cartons, picked and packed.</p>
    {#snippet footer()}<Button size="sm" variant="secondary">View</Button>{/snippet}
  </Card>
  <Card padding={false}>
    <p>No padding.</p>
  </Card>
</Example>

<Example title="Divider">
  <div style:inline-size="100%">
    <p>Above</p>
    <Divider />
    <p>Below</p>
  </div>
  <div style:display="flex" style:align-items="center" style:gap="var(--space-3)" style:block-size="2rem">
    <span>Left</span>
    <Divider orientation="vertical" />
    <span>Right</span>
  </div>
</Example>

<Example title="MetricCard">
  <MetricCard value="1,284" label="Orders today" />
  <MetricCard value="97.2%" label="Pick accuracy" trend={1.4} trendLabel="vs last week" />
  <MetricCard value={312} label="Open returns" description="Awaiting grading" trend={-6} trendLabel="vs last week" />
</Example>
