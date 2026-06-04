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
    ['table', stickyHeader ? 'sticky-header' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class="table-wrap">
  <table class={classes}>
    {#if caption}
      <caption class="caption">{caption}</caption>
    {/if}
    {@render children()}
  </table>
</div>
