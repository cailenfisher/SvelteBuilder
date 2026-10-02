<!-- Camp 2: imports diglossia for entity copy resolution. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import SectionLabel from './SectionLabel.svelte';
  import TopicTag from './TopicTag.svelte';
  import BylineList from './BylineList.svelte';
  import type { Article, ArticleStatus, AuthorProfile, Section, Topic } from '../schema/index.js';

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

  const classes = $derived(
    ['article-card', `article-card--${variant}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<article class={classes}>
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
