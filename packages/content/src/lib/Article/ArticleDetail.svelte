<!-- Full article renderer. Resolves headline, dek, lede and all block text via
     diglossia, by entity id — so it needs the article's structure, not its copy. The prop is
     ArticleRenderable rather than ArticleWithCopy for that reason; see the type. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { Snippet } from 'svelte';
  import ArticleBlockRenderer from './ArticleBlock/ArticleBlockRenderer.svelte';
  import MediaAssetFigure from '../MediaAsset/MediaAssetFigure.svelte';
  import ArticleBylineList from './ArticleByline/ArticleBylineList.svelte';
  import SectionLink from '../Section/SectionLink.svelte';
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

<article class={['article-detail', extraClass ?? ''].filter(Boolean).join(' ')}>
  <header class="article-detail__header">
    {#if primarySection}
      <SectionLink section={primarySection} {locale} {dictionary} class="article-detail__section" />
    {/if}

    <h1
      class="article-detail__headline"
      lang={headlineLocale !== locale ? headlineLocale : undefined}
    >
      {headline}
    </h1>

    {#if dek}
      <p class="article-detail__dek" lang={dekLocale !== locale ? dekLocale : undefined}>{dek}</p>
    {/if}

    <div class="article-detail__meta">
      {#if article.bylines && article.bylines.length > 0}
        <ArticleBylineList bylines={article.bylines} {locale} {dictionary} class="article-detail__bylines" />
      {/if}

      <div class="article-detail__timestamps">
        {#if publishedFormatted}
          <time class="article-detail__published" datetime={article.publishedAt ?? undefined}>
            {dictionary.formatText('content.article_detail.published', { date: publishedFormatted }, 'content')}
          </time>
        {/if}
        {#if updatedFormatted && updatedFormatted !== publishedFormatted}
          <time class="article-detail__updated" datetime={article.updatedAt ?? undefined}>
            {dictionary.formatText('content.article_detail.updated', { date: updatedFormatted }, 'content')}
          </time>
        {/if}
      </div>
    </div>
  </header>

  {#if heroAsset}
    <div class="article-detail__hero">
      <MediaAssetFigure
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
    <div class="article-detail__body">
      {#each article.blocks as block (block.id)}
        {#if !(heroAsset && block.id === lead?.blockId)}
          <ArticleBlockRenderer
            {block}
            {mediaAssets}
            {attributions}
            {storageBaseUrl}
            {locale}
            {dictionary}
            class="article-detail__block"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if after}
    <footer class="article-detail__after">
      {@render after()}
    </footer>
  {/if}
</article>
