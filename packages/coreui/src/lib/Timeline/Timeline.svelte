<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();

  const classes = $derived(['timeline', extraClass ?? ''].filter(Boolean).join(' '));
</script>

<ol class={classes}>
  {@render children()}
</ol>