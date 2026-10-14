<!-- Camp 2: resolves author name, bio, and expertise via hermes (scope = 'author_profile'). -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import ArticleCard from '../Article/ArticleCard.svelte';
  import type { AuthorProfile, ArticleWithCopy, MediaAsset } from '../schema/index.js';

  type Props = {
    author: AuthorProfile;
    articles: ArticleWithCopy[];
    mediaAssets: Map<number, MediaAsset>;
    storageBaseUrl: string;
    locale: string;
    avatarSrc?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    author,
    articles,
    mediaAssets,
    storageBaseUrl,
    locale,
    avatarSrc,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const name = $derived(dictionary.localText('name', 'author_profile', author.id));
  const bio = $derived(dictionary.localText('bio', 'author_profile', author.id));
  const expertise = $derived(dictionary.localText('expertise', 'author_profile', author.id));
</script>

<section class={['author-profile-detail', extraClass ?? ''].filter(Boolean).join(' ')}>
  <header class="author-profile-detail__header">
    {#if avatarSrc}
      <img
        src={avatarSrc}
        alt={name}
        class="author-profile-detail__avatar"
        width="80"
        height="80"
        loading="lazy"
        decoding="async"
      />
    {:else}
      <div class="author-profile-detail__avatar-placeholder" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </div>
    {/if}

    <div class="author-profile-detail__info">
      <h1 class="author-profile-detail__name">{name}</h1>
      {#if expertise}
        <p class="author-profile-detail__expertise">{expertise}</p>
      {/if}
    </div>
  </header>

  {#if bio}
    <p class="author-profile-detail__bio">{bio}</p>
  {/if}

  {#if articles.length > 0}
    <div class="author-profile-detail__articles">
      <h2 class="author-profile-detail__articles-heading">Articles by {name}</h2>
      <div class="author-profile-detail__article-list">
        {#each articles as article (article.id)}
          <ArticleCard
            {article}
            {mediaAssets}
            blocks={article.blocks}
            {storageBaseUrl}
            {locale}
            status={article.status}
            {dictionary}
            sections={article.sections ?? []}
            variant="river"
          />
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .author-profile-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .author-profile-detail__header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding-block-end: var(--space-6);
    border-block-end: 1px solid var(--border-color);
  }

  .author-profile-detail__avatar {
    width: 5rem;
    height: 5rem;
    border-radius: var(--radius-full, 9999px);
    object-fit: cover;
    flex-shrink: 0;
    background: var(--surface-raised);
  }

  .author-profile-detail__avatar-placeholder {
    width: 5rem;
    height: 5rem;
    border-radius: var(--radius-full, 9999px);
    background: var(--brand);
    color: var(--brand-fg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--weight-bold);
    flex-shrink: 0;
  }

  .author-profile-detail__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .author-profile-detail__name {
    margin: 0;
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    color: var(--text);
  }

  .author-profile-detail__expertise {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--brand-text);
    font-weight: var(--weight-medium);
  }

  .author-profile-detail__bio {
    margin: 0;
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--text-soft);
    max-width: 60ch;
  }

  .author-profile-detail__articles {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .author-profile-detail__articles-heading {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
    padding-block-end: var(--space-3);
    border-block-end: 1px solid var(--border-color);
  }

  .author-profile-detail__article-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-block-start: 1px solid var(--border-color);
  }
</style>
