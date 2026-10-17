<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['table-head', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<thead class={classes}>
  {@render children()}
</thead>