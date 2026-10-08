<script lang="ts">
  import { StockLevelBar } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';

  const levels = [
    { title: 'Healthy', onHand: 420, reserved: 60, reorderPoint: 100 },
    { title: 'Below reorder point', onHand: 80, reserved: 20, reorderPoint: 100 },
    { title: 'Fully reserved', onHand: 40, reserved: 40, reorderPoint: 25 },
    { title: 'Empty', onHand: 0, reserved: 0, reorderPoint: 25 },
    { title: 'No reorder point', onHand: 120, reserved: 0, reorderPoint: undefined },
  ];
</script>

{#each levels as level (level.title)}
  <Example title={level.title}>
    <div style:inline-size="min(100%, 24rem)">
      <StockLevelBar onHand={level.onHand} reserved={level.reserved} reorderPoint={level.reorderPoint} />
    </div>
  </Example>
{/each}
