<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { useField } from './use-field.js';

  type Size = 'sm' | 'md' | 'lg';

  type Props = Omit<HTMLInputAttributes, 'size'> & {
    size?: Size;
    error?: string | boolean;
    class?: string;
  };

  let {
    size = 'md',
    error,
    class: extraClass,
    value = $bindable(),
    ...restProps
  }: Props = $props();

  const field = useField();

  // Props win over Field context — explicit always takes precedence
  const resolvedId = $derived(restProps.id ?? field?.id);
  const resolvedRequired = $derived(restProps.required ?? field?.required);
  const resolvedDisabled = $derived(restProps.disabled ?? field?.disabled);

  // Error: prop wins; fall back to Field's error string
  const resolvedError = $derived(error ?? field?.error);
  const hasError = $derived(!!resolvedError);

  // aria-describedby: prefer explicit prop; otherwise build from Field ids
  const resolvedDescribedBy = $derived.by(() => {
    if (restProps['aria-describedby']) return restProps['aria-describedby'];
    const parts: string[] = [];
    if (field?.hint && !hasError) parts.push(field.hintId);
    if (hasError && field?.errorId) parts.push(field.errorId);
    return parts.length ? parts.join(' ') : undefined;
  });

  const classes = $derived(
    ['input', `input--${size}`, hasError ? 'input--error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class="input-wrapper">
  <input
    class={classes}
    id={resolvedId}
    required={resolvedRequired || undefined}
    disabled={resolvedDisabled || undefined}
    aria-invalid={hasError || undefined}
    aria-describedby={resolvedDescribedBy}
    bind:value
    {...restProps}
  />
</div>

<style>
  /* ------------------------------------------------------------------ */
  /* Wrapper                                                              */
  /* ------------------------------------------------------------------ */
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--primitive-space-1);
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Base                                                                 */
  /* ------------------------------------------------------------------ */
  .input {
    display: block;
    width: 100%;
    border: var(--input-border-width) solid var(--input-border);
    border-radius: var(--input-radius);
    background-color: var(--input-bg);
    color: var(--input-text);
    font-family: var(--font-sans);
    font-size: var(--input-font-size);
    line-height: var(--leading-normal);
    padding: 0 var(--input-padding-x);
    transition:
      border-color var(--input-transition),
      box-shadow var(--input-transition);
    appearance: none;
  }

  .input::placeholder {
    color: var(--input-placeholder);
  }

  /* ------------------------------------------------------------------ */
  /* Sizes                                                                */
  /* ------------------------------------------------------------------ */
  .input--sm {
    height: var(--input-height-sm);
    font-size: var(--text-xs);
  }
  .input--md {
    height: var(--input-height-md);
  }
  .input--lg {
    height: var(--input-height-lg);
    font-size: var(--text-base);
  }

  /* ------------------------------------------------------------------ */
  /* Focus                                                                */
  /* ------------------------------------------------------------------ */
  .input:focus-visible {
    outline: none;
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-focus-ring) 30%, transparent);
  }

  /* ------------------------------------------------------------------ */
  /* Error state                                                          */
  /* ------------------------------------------------------------------ */
  .input--error {
    border-color: var(--input-border-error);
  }

  .input--error:focus-visible {
    border-color: var(--input-border-error);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-danger-base) 30%, transparent);
  }

  /* ------------------------------------------------------------------ */
  /* Disabled                                                             */
  /* ------------------------------------------------------------------ */
  .input:disabled {
    background-color: var(--input-bg-disabled);
    border-color: var(--color-disabled-border);
    color: var(--color-disabled-text);
    cursor: not-allowed;
  }

  .input:disabled::placeholder {
    color: var(--color-disabled-text);
  }

  /* ------------------------------------------------------------------ */
  /* Read-only                                                            */
  /* ------------------------------------------------------------------ */
  .input:read-only:not(:disabled) {
    background-color: var(--color-surface-raised);
    cursor: default;
  }

  /* ------------------------------------------------------------------ */
  /* Inline error message                                                 */
  /* ------------------------------------------------------------------ */
  .input__error {
    font-size: var(--text-xs);
    color: var(--color-danger-text);
    line-height: var(--leading-snug);
  }

  /* ------------------------------------------------------------------ */
  /* Number input — remove browser spinner arrows                        */
  /* ------------------------------------------------------------------ */
  .input[type='number'] {
    -moz-appearance: textfield;
  }

  .input[type='number']::-webkit-outer-spin-button,
  .input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* ------------------------------------------------------------------ */
  /* Search input — remove browser clear button                          */
  /* ------------------------------------------------------------------ */
  .input[type='search']::-webkit-search-decoration,
  .input[type='search']::-webkit-search-cancel-button,
  .input[type='search']::-webkit-search-results-button,
  .input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }
</style>
