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
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  let last = $state('(nothing yet)');
  let showArchived = $state(false);
  let sort = $state('newest');

  const openCalls: boolean[] = $state([]);
  const selectCalls: string[] = $state([]);
  const checkedCalls: boolean[] = $state([]);
  const valueCalls: string[] = $state([]);
</script>

<Example title="Everything a menu can hold">
  <Menu>
    {#snippet trigger()}Actions{/snippet}
    <MenuGroup>
      <MenuLabel>Shipment 4182</MenuLabel>
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
    <MenuRadioGroup bind:value={sort}>
      <MenuLabel>Sort</MenuLabel>
      <MenuRadioItem value="newest">Newest first</MenuRadioItem>
      <MenuRadioItem value="oldest">Oldest first</MenuRadioItem>
    </MenuRadioGroup>
    <MenuSeparator />
    <MenuSub>
      {#snippet trigger()}Export{/snippet}
      <MenuItem onSelect={() => (last = 'Export CSV')}>CSV</MenuItem>
      <MenuItem onSelect={() => (last = 'Export PDF')}>PDF</MenuItem>
    </MenuSub>
  </Menu>
  <p role="status">
    Last action: {last}. Archived: {showArchived ? 'shown' : 'hidden'}. Sort: {sort}.
  </p>
</Example>

<Example title="A label outside a group">
  <Menu>
    {#snippet trigger()}More{/snippet}
    <MenuLabel>Shipment 4183</MenuLabel>
    <MenuItem onSelect={() => (last = 'Print')}>Print</MenuItem>
  </Menu>
</Example>

<Example title="Callbacks">
  <Menu onOpenChange={(next) => openCalls.push(next)}>
    {#snippet trigger()}Line actions{/snippet}
    <MenuItem onSelect={() => selectCalls.push('Split')}>Split</MenuItem>
    <MenuCheckboxItem onCheckedChange={(next) => checkedCalls.push(next)}>Flag line</MenuCheckboxItem>
    <MenuRadioGroup value="unit" onValueChange={(next) => valueCalls.push(next)}>
      <MenuRadioItem value="unit">Count in units</MenuRadioItem>
      <MenuRadioItem value="case">Count in cases</MenuRadioItem>
    </MenuRadioGroup>
  </Menu>
  <CallbackLog name="onOpenChange" calls={openCalls} />
  <CallbackLog name="onSelect" calls={selectCalls} />
  <CallbackLog name="onCheckedChange" calls={checkedCalls} />
  <CallbackLog name="onValueChange" calls={valueCalls} />
</Example>
