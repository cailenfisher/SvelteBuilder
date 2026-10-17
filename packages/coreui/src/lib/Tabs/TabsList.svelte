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