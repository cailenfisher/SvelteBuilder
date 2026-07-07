<!-- Camp 2: renders a single article block by dispatching on block_type.
     All text blocks resolve copy via hermes (scope = 'article_block', entityId = block.id).
     Structural config (heading level, embed provider) lives in block.content jsonb. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import MediaFigure from './MediaFigure.svelte';
  import type { ArticleBlock, MediaAsset } from '../schema/index.js';

  type Props = {
    block: ArticleBlock;
    mediaAssets: Map<bigint, MediaAsset>;
    storageBaseUrl: string;
    locale: string;
    class?: string | undefined;
  };

  let { block, mediaAssets, storageBaseUrl, locale, class: extraClass }: Props = $props();

  const text   = $derived(localText('text', 'article_block', block.id));
  const asset  = $derived(block.mediaAssetId != null ? (mediaAssets.get(block.mediaAssetId) ?? null) : null);
  const level  = $derived((block.content as { level?: number } | null)?.level ?? 2);
  const provider = $derived((block.content as { provider?: string } | null)?.provider ?? '');
  const embedSrc = $derived((block.content as { src?: string } | null)?.src ?? '');
</script>

<div class={['article-block', `article-block--${block.blockType}`, extraClass ?? ''].filter(Boolean).join(' ')}>
  {#if block.blockType === 'paragraph'}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="article-block__paragraph">{@html text}</p>

  {:else if block.blockType === 'heading'}
    {#if level === 2}
      <h2 class="article-block__heading">{text}</h2>
    {:else if level === 3}
      <h3 class="article-block__heading">{text}</h3>
    {:else if level === 4}
      <h4 class="article-block__heading">{text}</h4>
    {:else}
      <h2 class="article-block__heading">{text}</h2>
    {/if}

  {:else if block.blockType === 'pullquote'}
    <blockquote class="article-block__pullquote">
      <p>{text}</p>
    </blockquote>

  {:else if block.blockType === 'image' && asset}
    <MediaFigure {asset} {storageBaseUrl} {locale} />

  {:else if block.blockType === 'gallery'}
    <div class="article-block__gallery" role="region" aria-label="Photo gallery">
      {#if asset}
        <MediaFigure {asset} {storageBaseUrl} {locale} />
      {/if}
      {#if text}
        <p class="article-block__gallery-caption">{text}</p>
      {/if}
    </div>

  {:else if block.blockType === 'video' && asset}
    <MediaFigure {asset} {storageBaseUrl} {locale} />

  {:else if block.blockType === 'embed' && embedSrc}
    <div class="article-block__embed" data-provider={provider || undefined}>
      <iframe
        src={embedSrc}
        title={text || `${provider} embed`}
        loading="lazy"
        allowfullscreen
      ></iframe>
    </div>

  {:else if block.blockType === 'live_update'}
    <aside class="article-block__live-update" aria-label="Live update">
      <p>{text}</p>
    </aside>
  {/if}
</div>

<style>
  .article-block {
    width: 100%;
  }

  .article-block__paragraph {
    margin: 0;
    font-size: var(--text-lg);
    line-height: var(--leading-relaxed);
    color: var(--text);
  }

  .article-block__heading {
    margin: 0;
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight);
    color: var(--text);
  }

  .article-block__pullquote {
    margin: 0;
    padding: var(--space-4) var(--space-6);
    border-inline-start: 4px solid var(--brand);
  }

  .article-block__pullquote p {
    margin: 0;
    font-size: var(--text-xl);
    font-style: italic;
    line-height: var(--leading-snug);
    color: var(--text);
  }

  .article-block__gallery {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .article-block__gallery-caption {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
    font-style: italic;
  }

  .article-block__embed {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--surface-raised);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .article-block__embed iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }

  .article-block__live-update {
    padding: var(--space-3) var(--space-4);
    background: color-mix(in srgb, var(--brand), white 92%);
    border-inline-start: 3px solid var(--brand);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
  }

  .article-block__live-update p {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text);
  }
</style>
