<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<td class={['table-cell', extraClass ?? ''].filter(Boolean).join(' ')}>
  {@render children()}
</td>

<style>
  .table-cell {
    padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
    color: var(--color-text-primary);
    font-size: var(--table-font-size);
    line-height: var(--leading-snug);
  }
</style>
