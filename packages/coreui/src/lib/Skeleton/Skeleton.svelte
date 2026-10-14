<script lang="ts">
  type Props = {
    width?: string;
    height?: string;
    radius?: string;
    inline?: boolean;
    class?: string | undefined;
  };

  let {
    width,
    height,
    radius,
    inline = false,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['skeleton', inline ? 'inline' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );

  const style = $derived(
    [
      width  ? `width: ${width}`         : '',
      height ? `height: ${height}`       : '',
      radius ? `border-radius: ${radius}` : '',
    ]
      .filter(Boolean)
      .join('; ')
  );
</script>

<span
  class={classes}
  style={style || undefined}
  aria-hidden="true"
></span>