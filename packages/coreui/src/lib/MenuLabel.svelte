<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<DropdownMenu.GroupHeading
  class={['menu-label', extraClass ?? ''].filter(Boolean).join(' ')}
>
  {@render children()}
</DropdownMenu.GroupHeading>

<style>
  :global(.menu-label) {
    padding: var(--primitive-space-1-5) var(--menu-item-padding-x);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }
</style>
