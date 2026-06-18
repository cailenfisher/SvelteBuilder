<script lang="ts">
  type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  type Props = {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: Size;
    class?: string | undefined;
  };

  let {
    src,
    alt = '',
    fallback,
    size = 'md',
    class: extraClass,
  }: Props = $props();

  let imgError = $state(false);

  const showImage = $derived(!!src && !imgError);
  const initials = $derived(
    fallback
      ? fallback.slice(0, 2).toUpperCase()
      : alt
        ? alt
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : ''
  );

  const classes = $derived(
    ['avatar', size, extraClass ?? ''].filter(Boolean).join(' ')
  );

  function handleError() {
    imgError = true;
  }

  $effect(() => {
    if (src) imgError = false;
  });
</script>

<span class={classes} role="img" aria-label={alt || undefined}>
  {#if showImage}
    <img
      class="image"
      {src}
      alt={alt}
      aria-hidden={!alt || undefined}
      onerror={handleError}
    />
  {:else}
    <span class="fallback" aria-hidden="true">
      {initials}
    </span>
  {/if}
</span>