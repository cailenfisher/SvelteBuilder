<script lang="ts">
  import {
    Menu,
    MenuCheckboxItem,
    MenuGroup,
    MenuItem,
    MenuLabel,
    MenuRadioGroup,
    MenuRadioItem,
    MenuSeparator,
    MenuSub,
  } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  let last = $state('(nothing yet)');
  let showArchived = $state(false);
  let sort = $state('newest');
</script>

<Example title="Everything a menu can hold">
  <Menu>
    {#snippet trigger()}Actions{/snippet}
    <MenuLabel>Shipment 4182</MenuLabel>
    <MenuGroup>
      <MenuItem onSelect={() => (last = 'Edit')}>
        {#snippet leading()}✎{/snippet}
        Edit
      </MenuItem>
      <MenuItem onSelect={() => (last = 'Duplicate')}>Duplicate</MenuItem>
      <MenuItem disabled>Archive (disabled)</MenuItem>
    </MenuGroup>
    <MenuSeparator />
    <MenuCheckboxItem bind:checked={showArchived}>Show archived</MenuCheckboxItem>
    <MenuSeparator />
    <MenuLabel>Sort</MenuLabel>
    <MenuRadioGroup bind:value={sort}>
      <MenuRadioItem value="newest">Newest first</MenuRadioItem>
      <MenuRadioItem value="oldest">Oldest first</MenuRadioItem>
    </MenuRadioGroup>
    <MenuSeparator />
    <MenuSub triggerLabel="Export">
      <MenuItem onSelect={() => (last = 'Export CSV')}>CSV</MenuItem>
      <MenuItem onSelect={() => (last = 'Export PDF')}>PDF</MenuItem>
    </MenuSub>
  </Menu>
  <p role="status">Last action: {last}. Archived: {showArchived ? 'shown' : 'hidden'}. Sort: {sort}.</p>
</Example>
