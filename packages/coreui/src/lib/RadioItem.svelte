<script lang="ts">
  import { RadioGroup } from 'bits-ui';

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

  const wrapperClasses = $derived(
    ['radio-item', disabled ? 'radio-item--disabled' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<label class={wrapperClasses}>
  <RadioGroup.Item {value} {disabled} class="radio-item__control">
    {#snippet children({ checked })}
      <span class="radio-item__indicator" data-checked={checked || undefined}></span>
    {/snippet}
  </RadioGroup.Item>
  <span class="radio-item__label">{label}</span>
</label>

<style>
  .radio-item {
    display: inline-flex;
    align-items: center;
    gap: var(--primitive-space-2);
    cursor: pointer;
  }

  .radio-item--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* ------------------------------------------------------------------ */
  /* Control (rendered by Bits)                                           */
  /* ------------------------------------------------------------------ */
  :global(.radio-item__control) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--radio-size);
    height: var(--radio-size);
    border: var(--input-border-width) solid var(--checkbox-border);
    border-radius: var(--radius-full);
    background-color: var(--input-bg);
    flex-shrink: 0;
    transition:
      background-color var(--checkbox-transition),
      border-color var(--checkbox-transition);
    cursor: pointer;
    padding: 0;
    appearance: none;
  }

  :global(.radio-item__control[data-state="checked"]) {
    border-color: var(--checkbox-border-checked);
  }

  :global(.radio-item__control[data-disabled]) {
    background-color: var(--color-disabled-surface);
    border-color: var(--color-disabled-border);
    cursor: not-allowed;
  }

  :global(.radio-item__control:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* ------------------------------------------------------------------ */
  /* Inner dot                                                            */
  /* ------------------------------------------------------------------ */
  .radio-item__indicator {
    display: block;
    width: 45%;
    height: 45%;
    border-radius: var(--radius-full);
    background-color: transparent;
    transition: background-color var(--checkbox-transition);
  }

  /* The Bits Root element has data-state="checked"; the indicator is a
     sibling rendered via the children snippet. We use data-checked on the
     indicator itself (set from the snippet prop) for the fill. */
  .radio-item__indicator[data-checked] {
    background-color: var(--checkbox-bg-checked);
  }

  /* ------------------------------------------------------------------ */
  /* Label text                                                           */
  /* ------------------------------------------------------------------ */
  .radio-item__label {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    line-height: var(--leading-snug);
    user-select: none;
  }
</style>
