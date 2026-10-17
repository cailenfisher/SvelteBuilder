<script lang="ts">
  import { CycleCountLineTable } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
  import { CYCLE_COUNT_LINES, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="Matched, short, and not yet counted">
  <CycleCountLineTable cycleCountLines={CYCLE_COUNT_LINES} {dictionary} />
</Example>
