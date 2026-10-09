<script lang="ts">
  import { Button, Dialog, Drawer, Field, Input } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
  const sides = ['right', 'left', 'bottom'] as const;

  let formOpen = $state(false);
  let drawerOpen = $state(false);
</script>

<Example title="Dialog with its own trigger">
  {#each sizes as size (size)}
    <Dialog
      {size}
      title={`A ${size} dialog`}
      description="Escape or the close button dismisses it."
    >
      {#snippet trigger()}Open {size}{/snippet}
      <p>Focus is trapped inside while it is open.</p>
    </Dialog>
  {/each}
</Example>

<Example title="Controlled, with a footer">
  <Button onclick={() => (formOpen = true)}>Edit supplier</Button>
  <Dialog bind:open={formOpen} title="Edit supplier" closeLabel="Close editor">
    <Field id="dialog-supplier" label="Name">
      <Input value="Acme Freight" />
    </Field>
    {#snippet footer()}
      <Button variant="secondary" onclick={() => (formOpen = false)}>Cancel</Button>
      <Button onclick={() => (formOpen = false)}>Save</Button>
    {/snippet}
  </Dialog>
</Example>

<Example title="Drawer sides">
  {#each sides as side (side)}
    <Drawer {side} title={`Drawer from the ${side}`} description="A side panel for secondary work.">
      {#snippet trigger()}Open {side}{/snippet}
      <p>Drawer content.</p>
    </Drawer>
  {/each}
</Example>

<Example title="Controlled drawer with a footer">
  <Button variant="secondary" onclick={() => (drawerOpen = true)}>Filters</Button>
  <Drawer bind:open={drawerOpen} title="Filters" onOpenChange={(next) => (drawerOpen = next)}>
    <p>Filter controls go here.</p>
    {#snippet footer()}
      <Button onclick={() => (drawerOpen = false)}>Apply</Button>
    {/snippet}
  </Drawer>
</Example>
