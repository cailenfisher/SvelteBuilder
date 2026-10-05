<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Select } from 'bits-ui';
  import { useField } from './use-field.js';
  import SelectItemCollector from './SelectItemCollector.svelte';
  import type { SelectItemRecord, SelectItemRegistry } from './select-items.js';

  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    value?: string;
    placeholder?: string;
    size?: Size;
    disabled?: boolean;
    error?: string | boolean;
    name?: string;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    value = $bindable(''),
    placeholder = 'Select an option…',
    size = 'md',
    disabled,
    error,
    name,
    children,
    class: extraClass,
  }: Props = $props();

  const field = useField();

  // What each SelectItem child is called, so the trigger can show a label instead of the
  // selected value while the list is closed. See select-items.ts.
  let itemRecords = $state<Record<string, SelectItemRecord>>({});
  const registry: SelectItemRegistry = {
    set: (record) => {
      const current = itemRecords[record.value];
      if (current?.label === record.label && current?.disabled === record.disabled) return;
      itemRecords[record.value] = record;
    },
    delete: (itemValue) => {
      delete itemRecords[itemValue];
    },
  };
  const items = $derived(Object.values(itemRecords));

  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);
  const resolvedError = $derived(error ?? field?.error);
  const hasError = $derived(!!resolvedError);

  const triggerClasses = $derived(
    ['select-trigger', size, hasError ? 'error' : ''].filter(Boolean).join(' ')
  );

  const wrapperClasses = $derived(
    ['select', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={wrapperClasses}>
  <!-- Registration pass: renders nothing, but lets every SelectItem report its label before the
       Root below reads `items`. Must stay ahead of the Root in this template. -->
  <SelectItemCollector {registry}>{@render children()}</SelectItemCollector>

  <Select.Root type="single" bind:value {name} {items} disabled={resolvedDisabled}>
    <Select.Trigger class={triggerClasses} aria-invalid={hasError || undefined}>
      <Select.Value placeholder={placeholder} class="select-value" />
      <span class="chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content class="select-content" sideOffset={4}>
        <Select.ScrollUpButton class="select-scroll-btn up">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
            <path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </Select.ScrollUpButton>

        <Select.Viewport class="select-viewport">
          {@render children()}
        </Select.Viewport>

        <Select.ScrollDownButton class="select-scroll-btn down">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .select { position: relative; width: 100%; }
</style>
