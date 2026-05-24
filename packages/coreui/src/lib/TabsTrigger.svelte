<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  type Props = {
    value: string;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let { value, disabled = false, children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['tabs-trigger', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tabs.Trigger {value} {disabled} class={classes}>
  {@render children()}
</Tabs.Trigger>

<style>
  :global(.tabs-trigger) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--tabs-trigger-padding-y) var(--tabs-trigger-padding-x);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    font-family: var(--font-sans);
    font-size: var(--tabs-font-size);
    font-weight: var(--tabs-font-weight);
    color: var(--color-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color var(--duration-fast) var(--ease-out),
      background-color var(--duration-fast) var(--ease-out);
  }

  :global(.tabs-trigger:hover:not([data-disabled])) {
    color: var(--color-text-primary);
    background-color: var(--color-surface-base);
  }

  :global(.tabs-trigger[data-state="active"]) {
    color: var(--color-text-primary);
    background-color: var(--color-surface-base);
    box-shadow: var(--shadow-xs);
  }

  :global(.tabs-trigger[data-disabled]) {
    color: var(--color-disabled-text);
    cursor: not-allowed;
  }

  :global(.tabs-trigger:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* Vertical active indicator — left border */
  :global(.tabs--vertical .tabs-trigger[data-state="active"]) {
    border-left: var(--tabs-indicator-height) solid var(--tabs-active-color);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    padding-left: calc(var(--tabs-trigger-padding-x) - var(--tabs-indicator-height));
  }
</style>
