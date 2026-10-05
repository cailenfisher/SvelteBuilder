<!-- Camp 2: imports diglossia for entity copy resolution. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import SectionLabel from './SectionLabel.svelte';
  import TopicTag from './TopicTag.svelte';
  import BylineList from './BylineList.svelte';
  import MediaFigure from './MediaFigure.svelte';
  import { selectLeadMediaAssetId } from '../publishing/lead-image.js';
  import type {
    Article,
    ArticleBlock,
    ArticleStatus,
    AuthorProfile,
    MediaAsset,
    Section,
    Topic,
  } from '../schema/index.js';

  type Props = {
    article: Article;
    status: ArticleStatus;
    bylines?: AuthorProfile[];
    sections?: Section[];
    topics?: Topic[];
    locale: string;
    href?: string;
    showStatus?: boolean;
    variant?: 'lead' | 'secondary' | 'river' | 'brief';
    /**
     * Where the card's picture comes from: the article's lead image (its `leadMediaAssetId`,
     * else the first image block among `blocks`), looked up here. The same rule ArticleView's
     * hero and the social cards use. A card with no `mediaAssets`, or whose lead asset is not
     * in them, renders text only — as every card did before it could show a picture.
     */
    mediaAssets?: Map<number, MediaAsset>;
    /** The article's blocks, when the loader has them; needed only for the first-image rule. */
    blocks?: Pick<ArticleBlock, 'id' | 'blockType' | 'mediaAssetId'>[];
    storageBaseUrl?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    article,
    status,
    bylines = [],
    sections = [],
    topics = [],
    locale,
    href,
    showStatus = false,
    variant = 'river',
    mediaAssets,
    blocks = [],
    storageBaseUrl,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const headline = $derived(dictionary.localText('headline', 'article', article.id));
  const headlineLocale = $derived(dictionary.localeOf('headline', 'article', article.id));
  const dek = $derived(dictionary.localText('dek', 'article', article.id));
  const dekLocale = $derived(dictionary.localeOf('dek', 'article', article.id));

  const publishedDate = $derived(
    article.publishedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
          new Date(article.publishedAt)
        )
      : null
  );

  // Keyed by the status slugs the module's seed creates. A project that adds its own
  // statuses falls through to 'default' rather than rendering an invalid Badge variant.
  const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
    published: 'success',
    ready: 'warning',
    in_review: 'info',
  };

  const statusVariant = $derived(STATUS_VARIANT[status.slug] ?? 'default');

  const cardHref = $derived(href ?? `/article/${article.canonicalSlug}`);

  // lead: large, secondary: small, river: thumbnail, brief: none — a brief is a headline.
  const leadAsset = $derived.by(() => {
    if (variant === 'brief' || !mediaAssets || storageBaseUrl === undefined) return null;
    const lead = selectLeadMediaAssetId(
      { leadMediaAssetId: article.leadMediaAssetId, blocks },
      (id) => mediaAssets.has(id)
    );
    return lead ? (mediaAssets.get(lead.mediaAssetId) ?? null) : null;
  });

  const classes = $derived(
    [
      'article-card',
      `article-card--${variant}`,
      leadAsset ? 'article-card--with-media' : '',
      extraClass ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

<article class={classes}>
  {#if leadAsset && storageBaseUrl !== undefined}
    <!-- Decorative at thumbnail size: the headline link beside it already says what this is, and
         a second description of the same story would be read out twice. The large lead keeps
         its alt text. -->
    <div class="article-card__media">
      <MediaFigure
        asset={leadAsset}
        {storageBaseUrl}
        {locale}
        {dictionary}
        captioned={false}
        decorative={variant !== 'lead'}
        class="article-card__figure"
      />
    </div>
  {/if}

  {#if sections.length > 0}
    <div class="article-card__kicker" aria-label="Section">
      <SectionLabel section={sections[0]} {locale} {dictionary} />
    </div>
  {/if}

  <div class="article-card__body">
    <header class="article-card__header">
      {#if showStatus}
        <Badge variant={statusVariant} size="sm"
          >{dictionary.localText('name', 'article_status', status.id)}</Badge
        >
      {/if}

      <h2 class="article-card__headline">
        <a
          class="article-card__link"
          href={cardHref}
          lang={headlineLocale !== locale ? headlineLocale : undefined}>{headline}</a
        >
      </h2>
    </header>

    {#if variant !== 'brief'}
      <p class="article-card__dek" lang={dekLocale !== locale ? dekLocale : undefined}>{dek}</p>
    {/if}

    <footer class="article-card__meta">
      {#if bylines.length > 0}
        <BylineList {bylines} {locale} {dictionary} />
      {/if}

      {#if publishedDate}
        <time class="article-card__date" datetime={article.publishedAt ?? undefined}>
          {publishedDate}
        </time>
      {/if}

      {#if topics.length > 0 && variant !== 'brief'}
        <ul class="article-card__topics" aria-label="Topics">
          {#each topics as topic (topic.id)}
            <li><TopicTag {topic} {locale} href={`/?topic=${topic.slug}`} {dictionary} /></li>
          {/each}
        </ul>
      {/if}
    </footer>
  </div>
</article>

<style>
  .article-card {
    background: var(--surface-raised);
    border: var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xs);
    overflow: hidden;
    transition:
      box-shadow var(--duration) var(--ease),
      border-color var(--duration) var(--ease);
  }

  .article-card:hover {
    box-shadow: var(--shadow);
    border-color: var(--border-strong);
  }

  .article-card__media {
    line-height: 0;
  }

  /* The picture is cropped to a fixed ratio so a column of cards stays aligned whatever the
     source image's shape. Large for the lead, a banner for secondary. */
  .article-card__media :global(.media-figure__img) {
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 0;
  }

  .article-card--lead .article-card__media :global(.media-figure__img) {
    aspect-ratio: 3 / 2;
  }

  /* River cards put a thumbnail beside the text rather than above it. */
  .article-card--river.article-card--with-media {
    display: grid;
    grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
    align-items: start;
  }

  .article-card--river .article-card__media {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .article-card--river .article-card__media :global(.media-figure__img) {
    aspect-ratio: 4 / 3;
  }

  .article-card__kicker {
    padding: var(--space-3) var(--space-4) 0;
  }

  .article-card__body {
    padding: var(--space-3) var(--space-4) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .article-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .article-card__headline {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--text);
    margin: 0;
  }

  .article-card--lead .article-card__headline {
    font-size: var(--text-3xl);
  }
  .article-card--secondary .article-card__headline {
    font-size: var(--text-2xl);
  }
  .article-card--brief .article-card__headline {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
  }

  .article-card__link {
    color: inherit;
    text-decoration: none;
  }
  .article-card__link:hover {
    color: var(--link-text);
  }

  .article-card__dek {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--text-soft);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .article-card--lead .article-card__dek {
    -webkit-line-clamp: 4;
  }

  .article-card__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .article-card__date {
    white-space: nowrap;
  }

  .article-card__topics {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
