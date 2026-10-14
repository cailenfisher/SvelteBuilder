<script module lang="ts">
  export type InputSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { useField } from '../Field/use-field.js';

  type Props = Omit<HTMLInputAttributes, 'size'> & {
    size?: InputSize;
    error?: string | boolean;
    class?: string;
  };

  // svelte-ignore custom_element_props_identifier
  let {
    size = 'md',
    error,
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
    ['input', `input--${size}`, hasError ? 'input--error' : '', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class="input__wrap">
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
  .input__wrap {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
</style>
