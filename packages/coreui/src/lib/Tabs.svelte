<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  type Orientation = 'horizontal' | 'vertical';

  type Props = {
    value?: string;
    orientation?: Orientation;
    /** Called when the value changes, with the new value. See Checkbox's `onCheckedChange`. */
    onValueChange?: (value: string) => void;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    value = $bindable(''),
    orientation = 'horizontal',
    onValueChange,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['tabs', orientation, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tabs.Root
  bind:value
  {onValueChange}
  {orientation}
  class={classes}
>
  {@render children()}
</Tabs.Root>