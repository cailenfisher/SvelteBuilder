<script lang="ts">
  import { ArticleCard } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import {
    AUTHORS,
    DRAFT_ARTICLE,
    LEAD_ARTICLE,
    MEDIA_ASSETS,
    REVIEW_ARTICLE,
    REVIEW_BLOCKS,
    SECTIONS,
    STATUS,
    STORAGE_BASE_URL,
    TOPICS,
    contentDictionary,
  } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
  const variants = ['lead', 'secondary', 'river', 'brief'] as const;
</script>

{#each variants as variant (variant)}
  <Example title={`Variant: ${variant}, with its lead image`}>
    <div style:inline-size="min(100%, 40rem)">
      <ArticleCard
        article={LEAD_ARTICLE}
        status={STATUS.published}
        bylines={AUTHORS.slice(0, 1)}
        sections={SECTIONS.slice(1)}
        topics={TOPICS}
        locale="en"
        href={`#${LEAD_ARTICLE.canonicalSlug}`}
        {variant}
        mediaAssets={MEDIA_ASSETS}
        storageBaseUrl={STORAGE_BASE_URL}
        {dictionary}
      />
    </div>
  </Example>
{/each}

<Example title="Picture from the first image block, status shown">
  <div style:inline-size="min(100%, 40rem)">
    <ArticleCard
      article={REVIEW_ARTICLE}
      status={STATUS.inReview}
      locale="en"
      showStatus
      mediaAssets={MEDIA_ASSETS}
      blocks={REVIEW_BLOCKS}
      storageBaseUrl={STORAGE_BASE_URL}
      {dictionary}
    />
  </div>
</Example>

<Example title="Text only (no media), draft">
  <div style:inline-size="min(100%, 40rem)">
    <ArticleCard article={DRAFT_ARTICLE} status={STATUS.draft} locale="en" showStatus {dictionary} />
  </div>
</Example>
