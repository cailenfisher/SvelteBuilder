<script lang="ts">
  import { Button } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const variants = ['primary', 'secondary', 'ghost', 'danger', 'link'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  let presses = $state(0);
</script>

<Example title="Variants">
  {#each variants as variant (variant)}
    <Button {variant} onclick={() => presses++}>{variant}</Button>
  {/each}
</Example>

<Example title="Sizes">
  {#each sizes as size (size)}
    <Button {size}>Size {size}</Button>
  {/each}
</Example>

<Example title="States">
  <Button disabled>Disabled</Button>
  <Button loading>Loading</Button>
  <Button variant="secondary" disabled>Disabled secondary</Button>
</Example>

<Example title="Leading and trailing">
  <Button>
    {#snippet leading()}+{/snippet}
    Add item
  </Button>
  <Button variant="secondary">
    Next
    {#snippet trailing()}→{/snippet}
  </Button>
</Example>

<Example title="As a link">
  <Button href="/dev/coreui/badge" variant="secondary">Go to Badge</Button>
  <Button href="/dev/coreui/badge" disabled>Disabled link</Button>
</Example>

<Example title="Full width">
  <div style:inline-size="100%">
    <Button full>Full width</Button>
  </div>
</Example>

<p role="status">Pressed {presses} {presses === 1 ? 'time' : 'times'}.</p>
