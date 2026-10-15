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

  // Its own `error` marks it invalid too, but only the Field renders an error message, so the
  // description is the Field's: never an id nothing on the page has.
  const hasError = $derived(!!error || field?.['aria-invalid'] === true);
  const resolvedDescribedBy = $derived(restProps['aria-describedby'] ?? field?.['aria-describedby']);

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
