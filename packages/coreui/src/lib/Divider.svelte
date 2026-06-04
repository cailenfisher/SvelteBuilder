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
    ['divider', orientation, extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<Separator.Root
  {orientation}
  {decorative}
  class={classes}
/>