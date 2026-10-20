<script module lang="ts">
  export type CheckboxSize = 'sm' | 'md';
</script>

<script lang="ts">
  import { Checkbox } from 'bits-ui';
  import { useField } from '../Field/use-field.js';

  type Props = {
    checked?: boolean;
    indeterminate?: boolean;
    size?: CheckboxSize;
    label?: string;
    disabled?: boolean;
    /**
     * Shown and focusable, but not toggleable: for a value held somewhere else. Unlike `disabled`
     * it stays in the tab order, so its description is still reachable, and it is still announced
     * as checked or not.
     */
    readonly?: boolean;
    /**
     * Names the box by other elements' ids, for a box with no `label` of its own: a cell of a
     * grid named by its row and column headers, as `CheckboxMatrix` does.
     */
    'aria-labelledby'?: string;
    /** Ids of elements that describe the box, such as the reason it is read-only. */
    'aria-describedby'?: string;
    name?: string;
    value?: string;
    /**
     * Called when the box is toggled, with its new state.
     *
     * `bind:checked` covers the case where the parent owns the value and nothing else needs to
     * happen. This covers the case where something does — persisting the change, submitting the
     * form it sits in — which a bind alone cannot express without an effect watching the value,
     * and an effect would also fire for changes the parent made itself.
     */
    onCheckedChange?: (checked: boolean) => void;
    class?: string | undefined;
  };

  let {
    checked = $bindable(false),
    indeterminate = false,
    size = 'md',
    label,
    disabled,
    readonly = false,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    name,
    value,
    onCheckedChange,
    class: extraClass,
  }: Props = $props();

  const field = useField();

  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);

  const wrapClasses = $derived(['checkbox', extraClass ?? ''].filter(Boolean).join(' '));

  const boxClasses = $derived(['checkbox__control', `checkbox__control--${size}`].join(' '));
</script>

<label
  class={wrapClasses}
  data-disabled={resolvedDisabled || undefined}
  data-readonly={readonly || undefined}
>
  <Checkbox.Root
    bind:checked
    {onCheckedChange}
    {indeterminate}
    disabled={resolvedDisabled}
    {readonly}
    aria-labelledby={ariaLabelledby}
    aria-describedby={ariaDescribedby}
    {name}
    {value}
    class={boxClasses}
  >
    {#snippet children({ checked: isChecked, indeterminate: isIndeterminate })}
      <span class="checkbox__indicator">
        {#if isIndeterminate}
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="checkbox__icon">
            <path d="M2.5 6h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        {:else if isChecked}
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" class="checkbox__icon">
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
    {/snippet}
  </Checkbox.Root>

  {#if label}
    <span class="checkbox__label">{label}</span>
  {/if}
</label>
