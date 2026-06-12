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

  // svelte-ignore custom_element_props_identifier
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
    ['textarea', size, hasError ? 'error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class="wrap">
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
  .wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
  }
</style>
