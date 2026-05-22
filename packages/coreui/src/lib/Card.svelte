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
    ['card', padding ? 'card--padded' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<!--
  Use explicit branches so Svelte's static CSS analyser can see
  the class names and does not report them as unused.
-->
{#if element === 'article'}
  <article class={classes}>
    {#if header}<div class="card__header">{@render header()}</div>{/if}
    <div class="card__body">{@render children()}</div>
    {#if footer}<div class="card__footer">{@render footer()}</div>{/if}
  </article>
{:else}
  <div class={classes}>
    {#if header}<div class="card__header">{@render header()}</div>{/if}
    <div class="card__body">{@render children()}</div>
    {#if footer}<div class="card__footer">{@render footer()}</div>{/if}
  </div>
{/if}

<style>
  .card {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
  }

  /* ------------------------------------------------------------------ */
  /* Sections                                                             */
  /* ------------------------------------------------------------------ */
  .card__header,
  .card__body,
  .card__footer {
    display: flex;
    flex-direction: column;
  }

  .card--padded .card__header {
    padding: var(--card-padding) var(--card-padding) 0;
  }

  .card--padded .card__body {
    padding: var(--card-padding);
  }

  .card--padded .card__footer {
    padding: 0 var(--card-padding) var(--card-padding);
  }

  /* When there is a header, the body gets reduced top padding */
  .card--padded .card__header + .card__body {
    padding-top: 0;
  }

  /* ------------------------------------------------------------------ */
  /* Dividers between sections                                            */
  /* ------------------------------------------------------------------ */
  .card__header + .card__body {
    border-top: 1px solid var(--card-border);
  }

  .card__body + .card__footer {
    border-top: 1px solid var(--card-border);
  }
</style>
