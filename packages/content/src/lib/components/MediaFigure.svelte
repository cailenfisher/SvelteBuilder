<!-- Camp 2: resolves alt text, caption, and credit from hermes.
     Alt text is NEVER hardcoded — it is always resolved from the media_asset scope.
     Empty alt ("") is only valid for explicitly decorative images (pass decorative=true).
     SECURITY: storageBaseUrl is validated server-side before being passed to this component. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { MediaAsset, MediaAssetAttribution } from '../schema/index.js';
  import { licenseLabelFromUrl, safeHttpUrl } from '../publishing/license.js';

  type Props = {
    asset: MediaAsset;
    locale: string;
    storageBaseUrl: string;
    decorative?: boolean;
    loading?: 'lazy' | 'eager';
    /**
     * Public provenance for this asset (see MediaAssetAttribution). When given, the credit
     * links to the image's source page and the license is named, linked to its own URL.
     * Optional, because the data behind it is a separate public read most pages will not make.
     */
    attribution?: MediaAssetAttribution | null;
    /** Render the caption and credit. Cards pass `false` and show the picture alone. */
    captioned?: boolean;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    asset,
    locale: _locale,
    storageBaseUrl,
    decorative = false,
    loading = 'lazy',
    attribution = null,
    captioned = true,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const altText = $derived(
    decorative ? '' : dictionary.localText('alt_text', 'media_asset', asset.id)
  );
  const caption = $derived(dictionary.localText('caption', 'media_asset', asset.id));
  const credit = $derived(dictionary.localText('credit', 'media_asset', asset.id));
  const src = $derived(`${storageBaseUrl}/${asset.storageKey}`);

  // Only http(s) URLs become links; both come from editor input.
  const sourceHref = $derived(safeHttpUrl(attribution?.sourceUrl));
  const licenseHref = $derived(safeHttpUrl(attribution?.licenseUrl));
  const licenseLabel = $derived(
    licenseHref ? (licenseLabelFromUrl(licenseHref) ?? new URL(licenseHref).hostname) : null
  );
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

  {#if captioned && (caption || credit || licenseHref)}
    <figcaption class="media-figure__caption">
      {#if caption}<span class="media-figure__caption-text">{caption}</span>{/if}
      {#if credit || licenseHref}
        <span class="media-figure__credit" aria-label="Image credit">
          {#if credit}
            {#if sourceHref}
              <a class="media-figure__link" href={sourceHref} rel="noopener">{credit}</a>
            {:else}
              {credit}
            {/if}
          {/if}
          {#if licenseHref}
            {#if credit}<span aria-hidden="true"> · </span>{/if}
            <a class="media-figure__link" href={licenseHref} rel="license noopener"
              >{licenseLabel}</a
            >
          {/if}
        </span>
      {/if}
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

  .media-figure__link {
    color: inherit;
    text-decoration: underline;
  }

  .media-figure__link:hover {
    color: var(--link-text);
  }

  .media-figure__credit {
    font-size: var(--text-xs);
    color: var(--text-soft);
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
