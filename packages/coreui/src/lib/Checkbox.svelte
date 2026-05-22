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

  const rootClasses = $derived(
    ['checkbox-wrapper', extraClass ?? ''].filter(Boolean).join(' ')
  );

  const boxClasses = $derived(
    ['checkbox', `checkbox--${size}`].join(' ')
  );
</script>

<label class={rootClasses} data-disabled={resolvedDisabled || undefined}>
  <Checkbox.Root
    bind:checked
    {indeterminate}
    disabled={resolvedDisabled}
    {name}
    {value}
    class={boxClasses}
  >
    {#snippet children({ checked: isChecked, indeterminate: isIndeterminate })}
      <Checkbox.Indicator class="checkbox__indicator">
        {#if isIndeterminate}
          <!-- Dash for indeterminate -->
          <svg
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            focusable="false"
            class="checkbox__icon"
          >
            <path
              d="M2.5 6h7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        {:else if isChecked}
          <!-- Checkmark -->
          <svg
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            focusable="false"
            class="checkbox__icon"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {/if}
      </Checkbox.Indicator>
    {/snippet}
  </Checkbox.Root>

  {#if label}
    <span class="checkbox__label">{label}</span>
  {/if}
</label>

<style>
  .checkbox-wrapper {
    display: inline-flex;
    align-items: center;
    gap: var(--primitive-space-2);
    cursor: pointer;
  }

  .checkbox-wrapper[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* ------------------------------------------------------------------ */
  /* The control box (rendered by Bits)                                   */
  /* ------------------------------------------------------------------ */
  :global(.checkbox) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--input-border-width) solid var(--checkbox-border);
    border-radius: var(--checkbox-radius);
    background-color: var(--input-bg);
    flex-shrink: 0;
    transition:
      background-color var(--checkbox-transition),
      border-color var(--checkbox-transition);
    cursor: pointer;
    appearance: none;
    padding: 0;
    outline-offset: var(--focus-ring-offset);
  }

  :global(.checkbox--sm) {
    width: var(--checkbox-size-sm);
    height: var(--checkbox-size-sm);
  }

  :global(.checkbox--md) {
    width: var(--checkbox-size-md);
    height: var(--checkbox-size-md);
  }

  :global(.checkbox[data-state="checked"]),
  :global(.checkbox[data-state="indeterminate"]) {
    background-color: var(--checkbox-bg-checked);
    border-color: var(--checkbox-border-checked);
    color: var(--color-brand-foreground);
  }

  :global(.checkbox[data-disabled]) {
    background-color: var(--color-disabled-surface);
    border-color: var(--color-disabled-border);
    cursor: not-allowed;
  }

  :global(.checkbox:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* ------------------------------------------------------------------ */
  /* Indicator                                                            */
  /* ------------------------------------------------------------------ */
  :global(.checkbox__indicator) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .checkbox__icon {
    width: 70%;
    height: 70%;
  }

  /* ------------------------------------------------------------------ */
  /* Label text                                                           */
  /* ------------------------------------------------------------------ */
  .checkbox__label {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    line-height: var(--leading-snug);
    user-select: none;
  }
</style>
