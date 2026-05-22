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

<style>
  .table-head :global(tr) {
    background-color: var(--table-header-bg);
  }

  .table-head :global(th) {
    background-color: var(--table-header-bg);
    color: var(--color-text-secondary);
    font-weight: var(--table-header-weight);
    text-align: left;
    padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
    border-bottom: 1px solid var(--table-border);
    font-size: var(--table-font-size);
  }
</style>
