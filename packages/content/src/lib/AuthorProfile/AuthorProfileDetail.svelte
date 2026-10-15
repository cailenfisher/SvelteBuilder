<!-- An author's profile: resolves name, bio and expertise from the dictionary (scope = 'author_profile'). -->
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
      <h2 class="author-profile-detail__articles-heading">
        {dictionary.formatText('content.author_profile_detail.articles', { name }, 'content')}
      </h2>
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
