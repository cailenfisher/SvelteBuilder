<script lang="ts">
  import type { Snippet } from 'svelte';
  import { RadioGroup } from 'bits-ui';
  import { useField } from './use-field.js';

  type Orientation = 'vertical' | 'horizontal';

  type Props = {
    value?: string;
    orientation?: Orientation;
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

  const field = useField();
  const resolvedDisabled = $derived(disabled ?? field?.disabled ?? false);

  const classes = $derived(
    ['radio-group', orientation, extraClass ?? '']
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