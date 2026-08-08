<!-- Camp 2: full article renderer. Resolves headline, dek, lede, and all block text via hermes.
     Accepts ArticleWithCopy (enriched) from the server load function. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import type { Snippet } from 'svelte';
  import ArticleBlockRenderer from './ArticleBlockRenderer.svelte';
  import MediaFigure from './MediaFigure.svelte';
  import BylineList from './BylineList.svelte';
  import SectionLabel from './SectionLabel.svelte';
  import type { ArticleWithCopy, MediaAsset, Section } from '../schema/index.js';

  type Props = {
    article: ArticleWithCopy;
    mediaAssets: Map<bigint, MediaAsset>;
    storageBaseUrl: string;
    locale: string;
    /** Optional slot rendered after the article body (e.g. comment section). */
    after?: Snippet;
    class?: string | undefined;
  };

  let { article, mediaAssets, storageBaseUrl, locale, after, class: extraClass }: Props = $props();

  const headline    = $derived(localText('headline',  'article', article.id));
  const dek         = $derived(localText('dek',       'article', article.id));
  const primarySection: Section | undefined = $derived(article.sections?.[0]);

  const heroBlock  = $derived(article.blocks?.find((b) => b.blockType === 'image' && b.mediaAssetId != null) ?? null);
  const heroAsset  = $derived(heroBlock?.mediaAssetId != null ? (mediaAssets.get(heroBlock.mediaAssetId) ?? null) : null);

  const publishedFormatted = $derived(
    article.publishedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(article.publishedAt),
        )
      : null,
  );
  const updatedFormatted = $derived(
    article.updatedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(article.updatedAt),
        )
      : null,
  );
</script>

<article class={['article-view', extraClass ?? ''].filter(Boolean).join(' ')}>
  <header class="article-view__header">
    {#if primarySection}
      <SectionLabel section={primarySection} {locale} class="article-view__section" />
    {/if}

    <h1 class="article-view__headline">{headline}</h1>

    {#if dek}
      <p class="article-view__dek">{dek}</p>
    {/if}

    <div class="article-view__meta">
      {#if article.bylines && article.bylines.length > 0}
        <BylineList bylines={article.bylines} {locale} class="article-view__bylines" />
      {/if}

      <div class="article-view__timestamps" aria-label="Publication timestamps">
        {#if publishedFormatted}
          <time class="article-view__published" datetime={article.publishedAt ?? undefined}>
            Published {publishedFormatted}
          </time>
        {/if}
        {#if updatedFormatted && updatedFormatted !== publishedFormatted}
          <time class="article-view__updated" datetime={article.updatedAt ?? undefined}>
            Updated {updatedFormatted}
          </time>
        {/if}
      </div>
    </div>
  </header>

  {#if heroAsset}
    <div class="article-view__hero">
      <MediaFigure asset={heroAsset} {storageBaseUrl} {locale} loading="eager" />
    </div>
  {/if}

  {#if article.blocks && article.blocks.length > 0}
    <div class="article-view__body">
      {#each article.blocks as block (block.id)}
        <ArticleBlockRenderer {block} {mediaAssets} {storageBaseUrl} {locale} class="article-view__block" />
      {/each}
    </div>
  {/if}

  {#if after}
    <footer class="article-view__after">
      {@render after()}
    </footer>
  {/if}
</article>

<style>
  .article-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    max-width: var(--content-prose, 72ch);
    margin-inline: auto;
  }

  .article-view__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .article-view__headline {
    margin: 0;
    font-size: var(--text-4xl, 2.25rem);
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    color: var(--text);
  }

  .article-view__dek {
    margin: 0;
    font-size: var(--text-xl);
    line-height: var(--leading-snug);
    color: var(--text-soft);
  }

  .article-view__meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-block-end: var(--space-4);
    border-block-end: 1px solid var(--border-color);
  }

  .article-view__timestamps {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .article-view__published,
  .article-view__updated {
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .article-view__updated::before {
    content: '·';
    margin-inline-end: var(--space-3);
  }

  .article-view__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .article-view__after {
    padding-block-start: var(--space-8);
    border-block-start: 1px solid var(--border-color);
  }
</style>
