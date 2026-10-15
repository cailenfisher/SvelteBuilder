<script module lang="ts">
  export type RadioGroupOrientation = 'vertical' | 'horizontal';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { RadioGroup } from 'bits-ui';
  import { getFieldContext } from '../Field/use-field.js';

  type Props = {
    value?: string;
    orientation?: RadioGroupOrientation;
    disabled?: boolean;
    name?: string;
    /** Called when the selection changes, with the new value. See Checkbox's `onCheckedChange`. */
    onValueChange?: (value: string) => void;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    value = $bindable(''),
    orientation = 'vertical',
    disabled,
    name,
    onValueChange,
    children,
    class: extraClass,
  }: Props = $props();

  // The whole context, not useField(): the group is named by the Field's label id.
  const field = getFieldContext();
  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);

  const classes = $derived(
    ['radio-group', `radio-group--${orientation}`, extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<RadioGroup.Root
  bind:value
  {onValueChange}
  {orientation}
  disabled={resolvedDisabled}
  {name}
  aria-labelledby={field?.labelId}
  class={classes}
>
  {@render children()}
</RadioGroup.Root>