<script lang="ts">
  import { StorageLocationPath } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';
  import { AISLE, BIN, WAREHOUSE, ZONE, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="A bin, with its ancestors">
  <StorageLocationPath location={BIN} ancestors={[WAREHOUSE, ZONE, AISLE]} {dictionary} />
</Example>

<Example title="Custom separator">
  <StorageLocationPath
    location={BIN}
    ancestors={[WAREHOUSE, ZONE, AISLE]}
    separator="/"
    {dictionary}
  />
</Example>

<Example title="A top-level location">
  <StorageLocationPath location={WAREHOUSE} {dictionary} />
</Example>
