<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    as?: 'article' | 'div';
    padding?: boolean;
    children: Snippet;
    header?: Snippet;
    footer?: Snippet;
    class?: string | undefined;
  };

  let {
    as: element = 'div',
    padding = true,
    children,
    header,
    footer,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['card', padding ? 'padded' : '', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

{#if element === 'article'}
  <article class={classes}>
    {#if header}<div class="header">{@render header()}</div>{/if}
    <div class="body">{@render children()}</div>
    {#if footer}<div class="footer">{@render footer()}</div>{/if}
  </article>
{:else}
  <div class={classes}>
    {#if header}<div class="header">{@render header()}</div>{/if}
    <div class="body">{@render children()}</div>
    {#if footer}<div class="footer">{@render footer()}</div>{/if}
  </div>
{/if}