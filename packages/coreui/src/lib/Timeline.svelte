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

<style>
  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .timeline::before {
    content: '';
    position: absolute;
    inset-inline-start: calc(var(--space-3) - 1px);
    top: var(--space-2);
    bottom: var(--space-2);
    width: 2px;
    background-color: var(--color-border-default);
    border-radius: 1px;
  }
</style>
