<script lang="ts">
  import { Popover, Tooltip } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';
</script>

<Example title="Popover">
  <Popover>
    {#snippet trigger()}Stock detail{/snippet}
    <p>On hand 42, reserved 6, available 36.</p>
  </Popover>
</Example>

<Example title="Tooltip">
  <Tooltip content="Units on the shelf, including reserved">On hand</Tooltip>
  <Tooltip content="Opens after 150ms" delay={150}>Short delay</Tooltip>
  <Tooltip content="Opens after 1.2s" delay={1200}>Long delay</Tooltip>
</Example>
