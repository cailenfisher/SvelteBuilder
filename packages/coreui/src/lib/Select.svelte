<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Select } from 'bits-ui';
  import { useField } from './use-field.js';

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

  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);
  const resolvedError = $derived(error ?? field?.error);
  const hasError = $derived(!!resolvedError);

  const triggerClasses = $derived(
    [
      'select__trigger',
      `select__trigger--${size}`,
      hasError ? 'select__trigger--error' : '',
    ]
      .filter(Boolean)
      .join(' ')
  );

  const wrapperClasses = $derived(
    ['select', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={wrapperClasses}>
  <Select.Root type="single" bind:value {name} disabled={resolvedDisabled}>
    <Select.Trigger class={triggerClasses} aria-invalid={hasError || undefined}>
      <Select.Value placeholder={placeholder} class="select__value" />
      <span class="select__chevron" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content class="select__content" sideOffset={4}>
        <Select.ScrollUpButton class="select__scroll-btn select__scroll-btn--up">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
            <path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </Select.ScrollUpButton>

        <Select.Viewport class="select__viewport">
          {@render children()}
        </Select.Viewport>

        <Select.ScrollDownButton class="select__scroll-btn select__scroll-btn--down">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .select {
    position: relative;
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Trigger                                                              */
  /* ------------------------------------------------------------------ */
  :global(.select__trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--primitive-space-2);
    width: 100%;
    border: var(--input-border-width) solid var(--input-border);
    border-radius: var(--select-radius);
    background-color: var(--input-bg);
    color: var(--input-text);
    font-family: var(--font-sans);
    font-size: var(--input-font-size);
    padding: 0 var(--input-padding-x);
    cursor: pointer;
    text-align: left;
    transition:
      border-color var(--input-transition),
      box-shadow var(--input-transition);
    appearance: none;
  }

  :global(.select__trigger--sm) { height: var(--select-height-sm); font-size: var(--text-xs); }
  :global(.select__trigger--md) { height: var(--select-height-md); }
  :global(.select__trigger--lg) { height: var(--select-height-lg); font-size: var(--text-base); }

  :global(.select__trigger:focus-visible) {
    outline: none;
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-focus-ring) 30%, transparent);
  }

  :global(.select__trigger--error) {
    border-color: var(--input-border-error);
  }

  :global(.select__trigger--error:focus-visible) {
    border-color: var(--input-border-error);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-danger-base) 30%, transparent);
  }

  :global(.select__trigger[data-disabled]) {
    background-color: var(--input-bg-disabled);
    border-color: var(--color-disabled-border);
    color: var(--color-disabled-text);
    cursor: not-allowed;
  }

  :global(.select__value) {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Placeholder color */
  :global(.select__value[data-placeholder]) {
    color: var(--input-placeholder);
  }

  .select__chevron {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--color-text-tertiary);
    transition: transform var(--input-transition);
  }

  /* Rotate chevron when open */
  :global(.select__trigger[data-state="open"]) .select__chevron {
    transform: rotate(180deg);
  }

  /* ------------------------------------------------------------------ */
  /* Dropdown content                                                     */
  /* ------------------------------------------------------------------ */
  :global(.select__content) {
    background-color: var(--menu-bg);
    border: 1px solid var(--menu-border);
    border-radius: var(--menu-radius);
    box-shadow: var(--menu-shadow);
    z-index: var(--z-dropdown);
    min-width: var(--bits-select-anchor-width, 8rem);
    max-height: 20rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global(.select__viewport) {
    padding: var(--menu-padding);
    overflow-y: auto;
    flex: 1;
  }

  /* ------------------------------------------------------------------ */
  /* Scroll buttons                                                       */
  /* ------------------------------------------------------------------ */
  :global(.select__scroll-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.5rem;
    color: var(--color-text-secondary);
    cursor: default;
  }
</style>
