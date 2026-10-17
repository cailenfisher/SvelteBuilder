<script module lang="ts">
  export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
</script>

<script lang="ts">

  type Props = {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
    class?: string | undefined;
  };

  let {
    src,
    alt = '',
    fallback,
    size = 'md',
    class: extraClass,
  }: Props = $props();

  let imageError = $state(false);

  const showImage = $derived(!!src && !imageError);
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
    ['avatar', `avatar--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );

  function handleError() {
    imageError = true;
  }

  $effect(() => {
    if (src) imageError = false;
  });
</script>

<span class={classes} role="img" aria-label={alt || undefined}>
  {#if showImage}
    <img
      class="avatar__image"
      {src}
      alt={alt}
      aria-hidden={!alt || undefined}
      onerror={handleError}
    />
  {:else}
    <span class="avatar__fallback" aria-hidden="true">
      {initials}
    </span>
  {/if}
</span>