<script lang="ts">
  import { Popover, Tooltip } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
</script>

<Example title="Popover">
  <Popover>
    {#snippet trigger()}Stock detail{/snippet}
    <p>On hand 42, reserved 6, available 36.</p>
  </Popover>
</Example>

<Example title="Tooltip">
  <Tooltip content="Units on the shelf, including reserved">
    {#snippet trigger()}On hand{/snippet}
  </Tooltip>
  <Tooltip content="Opens after 150ms" delay={150}>
    {#snippet trigger()}Short delay{/snippet}
  </Tooltip>
  <Tooltip content="Opens after 1.2s" delay={1200}>
    {#snippet trigger()}Long delay{/snippet}
  </Tooltip>
</Example>
