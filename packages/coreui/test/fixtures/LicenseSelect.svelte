<script lang="ts">
  import Select from '../../src/lib/Select.svelte';
  import SelectItem from '../../src/lib/SelectItem.svelte';

  let { value = '' }: { value?: string } = $props();
  const licenses = [
    { value: 'all_rights_reserved', label: 'All rights reserved' },
    { value: 'creative_commons', label: 'Creative Commons' },
  ];
</script>

<Select name="license" {value} placeholder="Choose a license">
  {#each licenses as license (license.value)}
    <SelectItem value={license.value} label={license.label} />
  {/each}
</Select>
