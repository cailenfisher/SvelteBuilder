<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<tfoot class={['table-foot', extraClass ?? ''].filter(Boolean).join(' ')}>
  {@render children()}
</tfoot>

<style>
  .table-foot :global(tr) {
    border-top: 1px solid var(--table-border);
    background-color: var(--table-header-bg);
  }

  .table-foot :global(td),
  .table-foot :global(th) {
    padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
    font-size: var(--table-font-size);
    font-weight: var(--table-header-weight);
    color: var(--color-text-secondary);
  }
</style>
