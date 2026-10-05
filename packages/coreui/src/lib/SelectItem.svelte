<script lang="ts">
  import { getContext, untrack } from 'svelte';
  import { Select } from 'bits-ui';
  import { SELECT_ITEM_REGISTRY, type SelectItemRegistry } from './select-items.js';

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

  // Present only while the parent Select is collecting labels for its trigger; see
  // select-items.ts. In that mode this item registers itself and renders nothing.
  const registry = getContext<SelectItemRegistry | undefined>(SELECT_ITEM_REGISTRY);

  if (registry) {
    // In the script body as well as the effect below, because effects do not run during server
    // rendering and the trigger's label has to be right in the server-rendered HTML. Untracked,
    // since this writes state while the parent is mid-render.
    untrack(() => registry.set({ value, label, disabled }));

    $effect(() => {
      registry.set({ value, label, disabled });
      return () => registry.delete(value);
    });
  }

  const classes = $derived(
    ['select-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

{#if !registry}
  <Select.Item {value} {label} {disabled} class={classes}>
    {label}
  </Select.Item>
{/if}