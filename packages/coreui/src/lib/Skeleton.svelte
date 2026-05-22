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
    ['skeleton', inline ? 'skeleton--inline' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );

  const style = $derived(
    [
      width ? `width: ${width}` : '',
      height ? `height: ${height}` : '',
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

<style>
  .skeleton {
    display: block;
    background-color: var(--skeleton-bg);
    border-radius: var(--skeleton-radius);
    background-image: linear-gradient(
      90deg,
      var(--skeleton-bg) 0%,
      var(--skeleton-shimmer) 50%,
      var(--skeleton-bg) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  .skeleton--inline {
    display: inline-block;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
