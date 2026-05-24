<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    onSelect?: () => void;
    disabled?: boolean;
    children: Snippet;
    leading?: Snippet;
    class?: string | undefined;
  };

  let {
    onSelect,
    disabled = false,
    children,
    leading,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['menu-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.Item
  class={classes}
  {disabled}
  onSelect={onSelect}
>
  {#if leading}
    <span class="menu-item__leading" aria-hidden="true">
      {@render leading()}
    </span>
  {/if}
  {@render children()}
</DropdownMenu.Item>

<style>
  :global(.menu-item) {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--menu-item-height);
    padding: 0 var(--menu-item-padding-x);
    border-radius: var(--menu-item-radius);
    font-size: var(--menu-item-font-size);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    cursor: pointer;
    user-select: none;
    outline: none;
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  :global(.menu-item[data-highlighted]) {
    background-color: var(--color-surface-raised);
  }

  :global(.menu-item[data-disabled]) {
    color: var(--color-disabled-text);
    cursor: not-allowed;
    pointer-events: none;
  }

  .menu-item__leading {
    display: inline-flex;
    align-items: center;
    width: var(--menu-item-icon-size);
    height: var(--menu-item-icon-size);
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }
</style>
