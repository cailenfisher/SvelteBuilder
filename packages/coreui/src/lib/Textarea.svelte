<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { useField } from './use-field.js';

  type Size = 'sm' | 'md' | 'lg';

  type Props = Omit<HTMLTextareaAttributes, 'size'> & {
    size?: Size;
    error?: string | boolean;
    rows?: number;
    class?: string | undefined;
  };

  let {
    size = 'md',
    error,
    rows = 3,
    class: extraClass,
    value = $bindable(),
    ...restProps
  }: Props = $props();

  const field = useField();

  const resolvedId = $derived(restProps.id ?? field?.id);
  const resolvedRequired = $derived(restProps.required ?? field?.required);
  const resolvedDisabled = $derived(restProps.disabled ?? field?.disabled);

  const resolvedError = $derived(error ?? field?.error);
  const hasError = $derived(!!resolvedError);

  const resolvedDescribedBy = $derived.by(() => {
    if (restProps['aria-describedby']) return restProps['aria-describedby'];
    const parts: string[] = [];
    if (field?.hint && !hasError) parts.push(field.hintId);
    if (hasError && field?.errorId) parts.push(field.errorId);
    return parts.length ? parts.join(' ') : undefined;
  });

  const classes = $derived(
    ['textarea', `textarea--${size}`, hasError ? 'textarea--error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class="textarea-wrapper">
  <textarea
    class={classes}
    id={resolvedId}
    {rows}
    required={resolvedRequired || undefined}
    disabled={resolvedDisabled || undefined}
    aria-invalid={hasError || undefined}
    aria-describedby={resolvedDescribedBy}
    bind:value
    {...restProps}
  ></textarea>
</div>

<style>
  .textarea-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Base                                                                 */
  /* ------------------------------------------------------------------ */
  .textarea {
    display: block;
    width: 100%;
    border: var(--input-border-width) solid var(--input-border);
    border-radius: var(--input-radius);
    background-color: var(--input-bg);
    color: var(--input-text);
    font-family: var(--font-sans);
    font-size: var(--input-font-size);
    line-height: var(--leading-normal);
    padding: var(--textarea-padding-y) var(--input-padding-x);
    transition:
      border-color var(--input-transition),
      box-shadow var(--input-transition);
    resize: vertical;
    appearance: none;
  }

  .textarea::placeholder {
    color: var(--input-placeholder);
  }

  /* ------------------------------------------------------------------ */
  /* Sizes                                                                */
  /* ------------------------------------------------------------------ */
  .textarea--sm {
    min-height: var(--textarea-min-height-sm);
    font-size: var(--text-xs);
  }

  .textarea--md {
    min-height: var(--textarea-min-height-md);
  }

  .textarea--lg {
    min-height: var(--textarea-min-height-lg);
    font-size: var(--text-base);
  }

  /* ------------------------------------------------------------------ */
  /* Focus                                                                */
  /* ------------------------------------------------------------------ */
  .textarea:focus-visible {
    outline: none;
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-focus-ring) 30%, transparent);
  }

  /* ------------------------------------------------------------------ */
  /* Error state                                                          */
  /* ------------------------------------------------------------------ */
  .textarea--error {
    border-color: var(--input-border-error);
  }

  .textarea--error:focus-visible {
    border-color: var(--input-border-error);
    box-shadow: 0 0 0 var(--focus-ring-width)
      color-mix(in srgb, var(--color-danger) 30%, transparent);
  }

  /* ------------------------------------------------------------------ */
  /* Disabled                                                             */
  /* ------------------------------------------------------------------ */
  .textarea:disabled {
    background-color: var(--input-bg-disabled);
    border-color: var(--color-disabled-border);
    color: var(--color-disabled-text);
    cursor: not-allowed;
    resize: none;
  }

  .textarea:disabled::placeholder {
    color: var(--color-disabled-text);
  }

  /* ------------------------------------------------------------------ */
  /* Read-only                                                            */
  /* ------------------------------------------------------------------ */
  .textarea:read-only:not(:disabled) {
    background-color: var(--color-surface-raised);
    cursor: default;
  }
</style>
