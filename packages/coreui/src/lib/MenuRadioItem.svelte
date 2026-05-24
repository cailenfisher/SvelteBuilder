<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    value: string;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let { value, disabled = false, children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['menu-item', 'menu-item--radio', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.RadioItem {value} {disabled} class={classes}>
  <span class="menu-item__radio-dot" aria-hidden="true"></span>
  {@render children()}
</DropdownMenu.RadioItem>

<style>
  :global(.menu-item--radio) {
    padding-left: calc(var(--menu-item-padding-x) + 1.25rem);
    position: relative;
  }

  .menu-item__radio-dot {
    position: absolute;
    left: var(--menu-item-padding-x);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--menu-item-icon-size);
    height: var(--menu-item-icon-size);
  }

  .menu-item__radio-dot::after {
    content: '';
    display: block;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
    background-color: transparent;
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  :global(.menu-item--radio[data-state="checked"]) .menu-item__radio-dot::after {
    background-color: var(--color-brand);
  }
</style>
