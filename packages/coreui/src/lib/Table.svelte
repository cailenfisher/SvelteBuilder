<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    caption?: string;
    stickyHeader?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    caption,
    stickyHeader = false,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['table', stickyHeader ? 'table--sticky-header' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class="table-wrapper">
  <table class={classes}>
    {#if caption}
      <caption class="table__caption">{caption}</caption>
    {/if}
    {@render children()}
  </table>
</div>

<style>
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--table-border);
    border-radius: var(--radius-lg);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--table-font-size);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  .table__caption {
    caption-side: top;
    text-align: left;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
    border-bottom: 1px solid var(--table-border);
  }

  /* Sticky header */
  .table--sticky-header :global(thead th) {
    position: sticky;
    top: 0;
    z-index: var(--z-raised);
  }
</style>
