<script lang="ts">
  import { Separator } from 'bits-ui';

  type Props = {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
    class?: string | undefined;
  };

  let {
    orientation = 'horizontal',
    decorative = true,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    [
      'divider',
      `divider--${orientation}`,
      extraClass ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

<Separator.Root
  {orientation}
  {decorative}
  class={classes}
/>

<style>
  /* Bits Separator.Root renders the element — :global() is required
     because Svelte's scoped styles don't reach Bits-rendered nodes. */
  :global(.divider) {
    background-color: var(--divider-color);
    flex-shrink: 0;
  }

  :global(.divider--horizontal) {
    display: block;
    width: 100%;
    height: var(--divider-thickness);
  }

  :global(.divider--vertical) {
    display: inline-block;
    width: var(--divider-thickness);
    height: 100%;
    align-self: stretch;
  }
</style>
