<script module lang="ts">
  export type TextareaSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { useField } from '../Field/use-field.js';

  type Props = Omit<HTMLTextareaAttributes, 'size'> & {
    size?: TextareaSize;
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

  // Its own `error` marks it invalid too, but only the Field renders an error message, so the
  // description is the Field's: never an id nothing on the page has.
  const hasError = $derived(!!error || field?.['aria-invalid'] === true);
  const resolvedDescribedBy = $derived(restProps['aria-describedby'] ?? field?.['aria-describedby']);

  const classes = $derived(
    ['textarea', `textarea--${size}`, hasError ? 'textarea--error' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<div class="textarea__wrap">
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
