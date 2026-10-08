<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';

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

  setContext('field', {
    get id()      { return id; },
    get labelId() { return labelId; },
    get error()   { return error; },
    get hint()    { return hint; },
    get hintId()  { return hintId; },
    get errorId() { return errorId; },
    get required(){ return required; },
    get disabled(){ return disabled; },
  });
</script>

<div
  class={['field', extraClass ?? ''].filter(Boolean).join(' ')}
  data-disabled={disabled || undefined}
>
  <label class="label" for={id} id={labelId}>
    {label}
    {#if required}
      <span class="required" aria-hidden="true">*</span>
    {/if}
  </label>

  <div class="control">
    {@render children()}
  </div>

  {#if hint && !error}
    <span id={hintId} class="hint">{hint}</span>
  {/if}

  {#if error}
    <span id={errorId} class="error" role="alert">{error}</span>
  {/if}
</div>