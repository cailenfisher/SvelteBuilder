<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Label } from 'bits-ui';

  type Props = {
    for?: string;
    required?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    for: htmlFor,
    required = false,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['label', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Label.Root
  for={htmlFor}
  class={classes}
>
  {@render children()}
  {#if required}
    <span class="label__required" aria-hidden="true">*</span>
  {/if}
</Label.Root>

<style>
  /* Bits Label.Root renders the element — :global() is required. */
  :global(.label) {
    display: inline-flex;
    align-items: center;
    gap: var(--primitive-space-0-5);
    font-size: var(--label-font-size);
    font-weight: var(--label-font-weight);
    color: var(--label-color);
    line-height: var(--leading-snug);
    cursor: default;
  }

  .label__required {
    color: var(--label-required-color);
    font-weight: var(--weight-bold);
    line-height: 1;
  }
</style>
