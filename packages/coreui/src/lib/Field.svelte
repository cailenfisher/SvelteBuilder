<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    label: string;
    id: string;
    hint?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    children: Snippet;
    class?: string;
  };

  let {
    label,
    id,
    hint,
    error,
    required = false,
    disabled = false,
    children,
    class: extraClass,
  }: Props = $props();

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Expose to child inputs via context so they can wire aria-describedby
  // without the caller having to do it manually.
  import { setContext } from 'svelte';

  setContext('field', {
    get id() {
      return id;
    },
    get error() {
      return error;
    },
    get hint() {
      return hint;
    },
    get hintId() {
      return hintId;
    },
    get errorId() {
      return errorId;
    },
    get required() {
      return required;
    },
    get disabled() {
      return disabled;
    },
  });
</script>

<div
  class={['field', extraClass ?? ''].filter(Boolean).join(' ')}
  data-disabled={disabled || undefined}
>
  <label class="field__label" for={id}>
    {label}
    {#if required}
      <span class="field__required" aria-hidden="true">*</span>
    {/if}
  </label>

  <div class="field__control">
    {@render children()}
  </div>

  {#if hint && !error}
    <span id={hintId} class="field__hint">
      {hint}
    </span>
  {/if}

  {#if error}
    <span id={errorId} class="field__error" role="alert">
      {error}
    </span>
  {/if}
</div>

<style>
  /* ------------------------------------------------------------------ */
  /* Layout                                                               */
  /* ------------------------------------------------------------------ */
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--field-gap);
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Label                                                                */
  /* ------------------------------------------------------------------ */
  .field__label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-0-5);
    font-size: var(--label-font-size);
    font-weight: var(--label-font-weight);
    color: var(--label-color);
    line-height: var(--leading-snug);
    cursor: default;
  }

  .field[data-disabled] .field__label {
    color: var(--color-disabled-text);
  }

  /* ------------------------------------------------------------------ */
  /* Required indicator                                                   */
  /* ------------------------------------------------------------------ */
  .field__required {
    color: var(--label-required-color);
    font-weight: var(--weight-bold);
    line-height: 1;
  }

  /* ------------------------------------------------------------------ */
  /* Control slot                                                         */
  /* ------------------------------------------------------------------ */
  .field__control {
    position: relative;
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Hint                                                                 */
  /* ------------------------------------------------------------------ */
  .field__hint {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: var(--leading-snug);
  }

  .field[data-disabled] .field__hint {
    color: var(--color-disabled-text);
  }

  /* ------------------------------------------------------------------ */
  /* Error                                                                */
  /* ------------------------------------------------------------------ */
  .field__error {
    font-size: var(--text-xs);
    color: var(--color-danger-text);
    line-height: var(--leading-snug);
  }
</style>
