<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    checked?: boolean;
    onSelect?: () => void;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    checked = $bindable(false),
    onSelect,
    disabled = false,
    children: itemContent,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['menu-item', 'menu-item--checkbox', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.CheckboxItem
  bind:checked
  class={classes}
  {disabled}
  onSelect={onSelect}
>
  {#snippet children({ checked: isChecked })}
    <span class="menu-item__check" aria-hidden="true">
      {#if isChecked}
        <svg viewBox="0 0 12 12" fill="none" width="10" height="10" aria-hidden="true">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      {/if}
    </span>
    {@render itemContent()}
  {/snippet}
</DropdownMenu.CheckboxItem>

<style>
  :global(.menu-item--checkbox) {
    padding-left: calc(var(--menu-item-padding-x) + 1.25rem);
    position: relative;
  }

  .menu-item__check {
    position: absolute;
    left: var(--menu-item-padding-x);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--menu-item-icon-size);
    height: var(--menu-item-icon-size);
    color: var(--color-brand);
  }
</style>
