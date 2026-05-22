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
    ['avatar', `avatar--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );

  function handleError() {
    imgError = true;
  }

  // Reset error when src changes
  $effect(() => {
    if (src) imgError = false;
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

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--avatar-radius);
    background-color: var(--color-surface-overlay);
    color: var(--color-text-secondary);
    overflow: hidden;
    flex-shrink: 0;
    font-weight: var(--avatar-font-weight);
    user-select: none;
  }

  /* ------------------------------------------------------------------ */
  /* Sizes                                                                */
  /* ------------------------------------------------------------------ */
  .avatar--xs {
    width: var(--avatar-size-xs);
    height: var(--avatar-size-xs);
    font-size: var(--avatar-font-size-xs);
  }

  .avatar--sm {
    width: var(--avatar-size-sm);
    height: var(--avatar-size-sm);
    font-size: var(--avatar-font-size-sm);
  }

  .avatar--md {
    width: var(--avatar-size-md);
    height: var(--avatar-size-md);
    font-size: var(--avatar-font-size-md);
  }

  .avatar--lg {
    width: var(--avatar-size-lg);
    height: var(--avatar-size-lg);
    font-size: var(--avatar-font-size-lg);
  }

  .avatar--xl {
    width: var(--avatar-size-xl);
    height: var(--avatar-size-xl);
    font-size: var(--avatar-font-size-xl);
  }

  /* ------------------------------------------------------------------ */
  /* Image                                                                */
  /* ------------------------------------------------------------------ */
  .avatar__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* ------------------------------------------------------------------ */
  /* Fallback initials                                                    */
  /* ------------------------------------------------------------------ */
  .avatar__fallback {
    line-height: 1;
    letter-spacing: var(--tracking-wide);
  }
</style>
