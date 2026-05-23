<script lang="ts">
  import { Select } from 'bits-ui';

  type Props = {
    value: string;
    label: string;
    disabled?: boolean;
    class?: string | undefined;
  };

  let {
    value,
    label,
    disabled = false,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['select-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Select.Item {value} {label} {disabled} class={classes}>
  <Select.ItemText>{label}</Select.ItemText>
</Select.Item>

<style>
  :global(.select-item) {
    display: flex;
    align-items: center;
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

  :global(.select-item[data-highlighted]) {
    background-color: var(--color-surface-raised);
  }

  :global(.select-item[data-selected]) {
    color: var(--color-text-brand);
    font-weight: var(--weight-medium);
  }

  :global(.select-item[data-disabled]) {
    color: var(--color-disabled-text);
    cursor: not-allowed;
  }
</style>
