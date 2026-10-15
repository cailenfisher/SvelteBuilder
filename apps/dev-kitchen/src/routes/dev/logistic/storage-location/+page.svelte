<script lang="ts">
  import { StorageLocationFieldset, StorageLocationPath } from '@sveltebuilder/logistic';
  import Example from '$lib/Example/Example.svelte';
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

<Example title="StorageLocationFieldset: choosing bins to count">
  <StorageLocationFieldset
    storageLocations={[BIN, AISLE]}
    name="storage_location_ids"
    legend="Locations to count"
    {dictionary}
  />
</Example>
