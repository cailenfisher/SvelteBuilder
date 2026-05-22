<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['tabs-list', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tabs.List class={classes}>
  {@render children()}
</Tabs.List>

<style>
  :global(.tabs-list) {
    display: flex;
    align-items: center;
    background-color: var(--tabs-list-bg);
    border-radius: var(--tabs-list-radius);
    padding: var(--primitive-space-1);
    gap: var(--tabs-gap);
    flex-shrink: 0;
  }

  /* Vertical orientation */
  :global(.tabs--vertical .tabs-list) {
    flex-direction: column;
    align-items: stretch;
  }
</style>
