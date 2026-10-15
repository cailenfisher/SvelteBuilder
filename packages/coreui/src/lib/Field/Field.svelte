<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setFieldContext } from './use-field.js';

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

  const labelId = $derived(`${id}-label`);
  const hintId = $derived(`${id}-hint`);
  const errorId = $derived(`${id}-error`);

  // Decided once here rather than in every control: the error when there is one (the hint is not
  // rendered then), otherwise the hint. Never an id the markup below does not render.
  const describedBy = $derived(error ? errorId : hint ? hintId : undefined);

  setFieldContext({
    get id()          { return id; },
    get labelId()     { return labelId; },
    get error()       { return error; },
    get hint()        { return hint; },
    get hintId()      { return hintId; },
    get errorId()     { return errorId; },
    get describedBy() { return describedBy; },
    get required()    { return required; },
    get disabled()    { return disabled; },
  });
</script>

<div
  class={['field', extraClass ?? ''].filter(Boolean).join(' ')}
  data-disabled={disabled || undefined}
>
  <label class="field__label" for={id} id={labelId}>
    {label}
    {#if required}
      <span class="field__required" aria-hidden="true">*</span>
    {/if}
  </label>

  <div class="field__control">
    {@render children()}
  </div>

  {#if hint && !error}
    <span id={hintId} class="field__hint">{hint}</span>
  {/if}

  {#if error}
    <span id={errorId} class="field__error" role="alert">{error}</span>
  {/if}
</div>