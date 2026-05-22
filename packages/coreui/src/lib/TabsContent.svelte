<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  type Props = {
    value: string;
    children: Snippet;
    class?: string | undefined;
  };

  let { value, children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['tabs-content', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tabs.Content {value} class={classes}>
  {@render children()}
</Tabs.Content>

<style>
  :global(.tabs-content) {
    flex: 1;
    min-width: 0;
  }

  :global(.tabs-content:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
</style>
