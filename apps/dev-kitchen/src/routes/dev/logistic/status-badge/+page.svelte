<!-- The badges take a resolved label: the caller owns the copy. These labels are what the
     shipment and return screens resolve from the seed. -->
<script lang="ts">
  import { ReturnConditionBadge, ShipmentStatusBadge } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';

  const shipmentStatuses = [
    ['created', 'Created'],
    ['packed', 'Packed'],
    ['dispatched', 'Dispatched'],
    ['in_transit', 'In transit'],
    ['delivered', 'Delivered'],
    ['exception', 'Exception'],
  ] as const;

  const conditions = [
    ['salable', 'Salable'],
    ['damaged', 'Damaged'],
    ['defective', 'Defective'],
    ['wrong_item', 'Wrong item'],
  ] as const;
</script>

<Example title="ShipmentStatusBadge">
  {#each shipmentStatuses as [status, label] (status)}
    <ShipmentStatusBadge {status} {label} />
  {/each}
</Example>

<Example title="ReturnConditionBadge">
  {#each conditions as [condition, label] (condition)}
    <ReturnConditionBadge {condition} {label} />
  {/each}
</Example>
