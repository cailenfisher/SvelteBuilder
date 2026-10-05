<!-- Camp 2: full article renderer. Resolves headline, dek, lede and all block text via
     diglossia, by entity id — so it needs the article's structure, not its copy. The prop is
     ArticleRenderable rather than ArticleWithCopy for that reason; see the type. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { Snippet } from 'svelte';
  import ArticleBlockRenderer from './ArticleBlockRenderer.svelte';
  import MediaFigure from './MediaFigure.svelte';
  import BylineList from './BylineList.svelte';
  import SectionLabel from './SectionLabel.svelte';
  import { selectLeadMediaAssetId } from '../publishing/lead-image.js';
  import type {
    ArticleRenderable,
    MediaAsset,
    MediaAssetAttribution,
    Section,
  } from '../schema/index.js';

  type Props = {
    article: ArticleRenderable;
    mediaAssets: Map<number, MediaAsset>;
    /** Public provenance by asset id: links each credit to its source and names its license. */
    attributions?: Map<number, MediaAssetAttribution>;
    storageBaseUrl: string;
    locale: string;
    /**
     * Lift the first image block out of the body and render it above it, eagerly loaded, as the
     * lead image. The body then skips that block, so it is rendered once. Pass `false` to leave
     * every image in place, in the body, in reading order. Default `true`.
     */
    hero?: boolean;
    /** Optional slot rendered after the article body (e.g. comment section). */
    after?: Snippet;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    article,
    mediaAssets,
    attributions,
    storageBaseUrl,
    locale,
    hero = true,
    after,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const headline = $derived(dictionary.localText('headline', 'article', article.id));
  const headlineLocale = $derived(dictionary.localeOf('headline', 'article', article.id));
  const dek = $derived(dictionary.localText('dek', 'article', article.id));
  const dekLocale = $derived(dictionary.localeOf('dek', 'article', article.id));
  const primarySection: Section | undefined = $derived(article.sections?.[0]);

  // The same rule buildArticleMetaTags and buildNewsArticleJsonLd use for og:image and the
  // JSON-LD image — the editor's lead image, else the first image block — so the picture on the
  // page is the one a share card shows.
  const lead = $derived(hero ? selectLeadMediaAssetId(article, (id) => mediaAssets.has(id)) : null);
  const heroAsset = $derived(lead ? (mediaAssets.get(lead.mediaAssetId) ?? null) : null);

  const publishedFormatted = $derived(
    article.publishedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(article.publishedAt)
        )
      : null
  );
  const updatedFormatted = $derived(
    article.updatedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(article.updatedAt)
        )
      : null
  );
</script>

<article class={['article-view', extraClass ?? ''].filter(Boolean).join(' ')}>
  <header class="article-view__header">
    {#if primarySection}
      <SectionLabel section={primarySection} {locale} {dictionary} class="article-view__section" />
    {/if}

    <h1
      class="article-view__headline"
      lang={headlineLocale !== locale ? headlineLocale : undefined}
    >
      {headline}
    </h1>

    {#if dek}
      <p class="article-view__dek" lang={dekLocale !== locale ? dekLocale : undefined}>{dek}</p>
    {/if}

    <div class="article-view__meta">
      {#if article.bylines && article.bylines.length > 0}
        <BylineList bylines={article.bylines} {locale} {dictionary} class="article-view__bylines" />
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
      <MediaFigure
        asset={heroAsset}
        attribution={attributions?.get(heroAsset.id) ?? null}
        {storageBaseUrl}
        {locale}
        {dictionary}
        loading="eager"
      />
    </div>
  {/if}

  {#if article.blocks && article.blocks.length > 0}
    <div class="article-view__body">
      {#each article.blocks as block (block.id)}
        {#if !(heroAsset && block.id === lead?.blockId)}
          <ArticleBlockRenderer
            {block}
            {mediaAssets}
            {attributions}
            {storageBaseUrl}
            {locale}
            {dictionary}
            class="article-view__block"
          />
        {/if}
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
