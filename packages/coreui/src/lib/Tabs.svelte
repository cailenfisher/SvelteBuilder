<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  type Orientation = 'horizontal' | 'vertical';

  type Props = {
    value?: string;
    orientation?: Orientation;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    value = $bindable(''),
    orientation = 'horizontal',
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['tabs', `tabs--${orientation}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tabs.Root
  bind:value
  {orientation}
  class={classes}
>
  {@render children()}
</Tabs.Root>

<style>
  :global(.tabs) {
    display: flex;
    width: 100%;
  }

  :global(.tabs--horizontal) {
    flex-direction: column;
  }

  :global(.tabs--vertical) {
    flex-direction: row;
    gap: var(--primitive-space-4);
  }
</style>
