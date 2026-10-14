<!-- Camp 2: renders a single article block by dispatching on block_type.
     All text blocks resolve copy via hermes (scope = 'article_block', entityId = block.id).
     Structural config (heading level, embed provider) lives in block.content jsonb. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import MediaAssetFigure from '../../MediaAsset/MediaAssetFigure.svelte';
  import type { ArticleBlock, MediaAsset, MediaAssetAttribution } from '../../schema/index.js';

  type Props = {
    block: ArticleBlock;
    mediaAssets: Map<number, MediaAsset>;
    /** Public provenance by asset id, passed through to MediaAssetFigure. */
    attributions?: Map<number, MediaAssetAttribution>;
    storageBaseUrl: string;
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    block,
    mediaAssets,
    attributions,
    storageBaseUrl,
    locale,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const text = $derived(dictionary.localText('text', 'article_block', block.id));
  const asset = $derived(
    block.mediaAssetId != null ? (mediaAssets.get(block.mediaAssetId) ?? null) : null
  );
  const attribution = $derived(asset ? (attributions?.get(asset.id) ?? null) : null);
  const level = $derived((block.content as { level?: number } | null)?.level ?? 2);
  const provider = $derived((block.content as { provider?: string } | null)?.provider ?? '');
  const embedSrc = $derived((block.content as { src?: string } | null)?.src ?? '');
</script>

<div
  class={['article-block-renderer', `article-block-renderer--${block.blockType}`, extraClass ?? '']
    .filter(Boolean)
    .join(' ')}
>
  {#if block.blockType === 'paragraph'}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="article-block-renderer__paragraph">{@html text}</p>
  {:else if block.blockType === 'heading'}
    {#if level === 2}
      <h2 class="article-block-renderer__heading">{text}</h2>
    {:else if level === 3}
      <h3 class="article-block-renderer__heading">{text}</h3>
    {:else if level === 4}
      <h4 class="article-block-renderer__heading">{text}</h4>
    {:else}
      <h2 class="article-block-renderer__heading">{text}</h2>
    {/if}
  {:else if block.blockType === 'pullquote'}
    <blockquote class="article-block-renderer__pullquote">
      <p class="article-block-renderer__pullquote-text">{text}</p>
    </blockquote>
  {:else if block.blockType === 'image' && asset}
    <MediaAssetFigure {asset} {attribution} {storageBaseUrl} {locale} {dictionary} />
  {:else if block.blockType === 'gallery'}
    <div class="article-block-renderer__gallery" role="region" aria-label="Photo gallery">
      {#if asset}
        <MediaAssetFigure {asset} {attribution} {storageBaseUrl} {locale} {dictionary} />
      {/if}
      {#if text}
        <p class="article-block-renderer__gallery-caption">{text}</p>
      {/if}
    </div>
  {:else if block.blockType === 'video' && asset}
    <MediaAssetFigure {asset} {attribution} {storageBaseUrl} {locale} {dictionary} />
  {:else if block.blockType === 'embed' && embedSrc}
    <div class="article-block-renderer__embed" data-provider={provider || undefined}>
      <iframe class="article-block-renderer__embed-frame" src={embedSrc} title={text || `${provider} embed`} loading="lazy" allowfullscreen
      ></iframe>
    </div>
  {:else if block.blockType === 'live_update'}
    <aside class="article-block-renderer__live-update" aria-label="Live update">
      <p class="article-block-renderer__live-update-text">{text}</p>
    </aside>
  {/if}
</div>
