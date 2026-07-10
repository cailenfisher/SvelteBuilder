<script lang="ts">
  import { Checkbox } from 'bits-ui';
  import { useField } from './use-field.js';

  type Size = 'sm' | 'md';

  type Props = {
    checked?: boolean;
    indeterminate?: boolean;
    size?: Size;
    label?: string;
    disabled?: boolean;
    name?: string;
    value?: string;
    class?: string | undefined;
  };

  let {
    checked = $bindable(false),
    indeterminate = false,
    size = 'md',
    label,
    disabled,
    name,
    value,
    class: extraClass,
  }: Props = $props();

  const field = useField();

  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);

  const wrapClasses = $derived(
    ['checkbox-wrap', extraClass ?? ''].filter(Boolean).join(' ')
  );

  const boxClasses = $derived(['checkbox', size].join(' '));
</script>

<label class={wrapClasses} data-disabled={resolvedDisabled || undefined}>
  <Checkbox.Root
    bind:checked
    {indeterminate}
    disabled={resolvedDisabled}
    {name}
    {value}
    class={boxClasses}
  >
    {#snippet children({ checked: isChecked, indeterminate: isIndeterminate })}
      <span class="checkbox-indicator">
        {#if isIndeterminate}
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="icon">
            <path d="M2.5 6h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        {:else if isChecked}
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="icon">
            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
      </span>
    {/snippet}
  </Checkbox.Root>

  {#if label}
    <span class="label">{label}</span>
  {/if}
</label>