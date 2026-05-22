<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<tbody class={['table-body', extraClass ?? ''].filter(Boolean).join(' ')}>
  {@render children()}
</tbody>

<style>
  .table-body :global(tr:hover) {
    background-color: var(--table-row-hover-bg);
  }

  .table-body :global(tr + tr td) {
    border-top: 1px solid var(--table-border);
  }

  .table-body :global(td) {
    padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
    color: var(--color-text-primary);
    font-size: var(--table-font-size);
    line-height: var(--leading-snug);
  }
</style>
