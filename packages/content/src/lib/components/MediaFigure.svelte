<!-- Camp 2: resolves alt text, caption, and credit from hermes.
     Alt text is NEVER hardcoded — it is always resolved from the media_asset scope.
     Empty alt ("") is only valid for explicitly decorative images (pass decorative=true).
     SECURITY: storageBaseUrl is validated server-side before being passed to this component. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import type { MediaAsset } from '../schema/index.js';

  type Props = {
    asset: MediaAsset;
    locale: string;
    storageBaseUrl: string;
    decorative?: boolean;
    loading?: 'lazy' | 'eager';
    class?: string | undefined;
  };

  let {
    asset,
    locale: _locale,
    storageBaseUrl,
    decorative = false,
    loading = 'lazy',
    class: extraClass,
  }: Props = $props();

  const altText  = $derived(decorative ? '' : localText('alt_text', 'media_asset', asset.id));
  const caption  = $derived(localText('caption', 'media_asset', asset.id));
  const credit   = $derived(localText('credit',  'media_asset', asset.id));
  const src      = $derived(`${storageBaseUrl}/${asset.storageKey}`);
</script>

<figure class={['media-figure', extraClass ?? ''].filter(Boolean).join(' ')}>
  {#if asset.mediaType === 'image'}
    <img
      {src}
      alt={altText}
      class="media-figure__img"
      width={asset.width ?? undefined}
      height={asset.height ?? undefined}
      {loading}
      decoding="async"
    />
  {:else if asset.mediaType === 'video'}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      src={`${storageBaseUrl}/${asset.storageKey}`}
      class="media-figure__video"
      controls
      aria-label={altText || undefined}
    ></video>
  {/if}

  {#if caption || credit}
    <figcaption class="media-figure__caption">
      {#if caption}<span class="media-figure__caption-text">{caption}</span>{/if}
      {#if credit}<span class="media-figure__credit" aria-label="Image credit">{credit}</span>{/if}
    </figcaption>
  {/if}
</figure>

<style>
  .media-figure {
    margin: 0;
    display: block;
  }

  .media-figure__img,
  .media-figure__video {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--radius-lg);
    background: var(--surface-raised);
  }

  .media-figure__caption {
    margin-block-start: var(--space-2);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .media-figure__caption-text {
    font-size: var(--text-sm);
    color: var(--text-soft);
    line-height: var(--leading-snug);
    font-style: italic;
  }

  .media-figure__credit {
    font-size: var(--text-xs);
    color: var(--text-soft);
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
