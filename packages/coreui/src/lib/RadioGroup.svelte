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
    children: Snippet;
    class?: string | undefined;
  };

  let {
    value = $bindable(''),
    orientation = 'vertical',
    disabled,
    name,
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
  {orientation}
  disabled={resolvedDisabled}
  {name}
  class={classes}
>
  {@render children()}
</RadioGroup.Root>