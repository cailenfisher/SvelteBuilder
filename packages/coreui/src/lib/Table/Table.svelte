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

  const rootClasses = $derived(['table', extraClass ?? ''].filter(Boolean).join(' '));
  const elementClasses = $derived(
    ['table__element', stickyHeader ? 'table__element--sticky-header' : ''].filter(Boolean).join(' ')
  );
</script>

<div class={rootClasses}>
  <table class={elementClasses}>
    {#if caption}
      <caption class="table__caption">{caption}</caption>
    {/if}
    {@render children()}
  </table>
</div>
