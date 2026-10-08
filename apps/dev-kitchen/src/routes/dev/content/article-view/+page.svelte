<script lang="ts">
  import { ArticleView } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import {
    ATTRIBUTIONS,
    AUTHORS,
    BLOCKS,
    LEAD_ARTICLE,
    MEDIA_ASSETS,
    SECTIONS,
    STORAGE_BASE_URL,
    contentDictionary,
  } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
  const article = { ...LEAD_ARTICLE, bylines: AUTHORS, sections: SECTIONS.slice(1), blocks: BLOCKS };
</script>

<Example title="With hero image">
  <ArticleView
    {article}
    mediaAssets={MEDIA_ASSETS}
    attributions={ATTRIBUTIONS}
    storageBaseUrl={STORAGE_BASE_URL}
    locale="en"
    {dictionary}
  >
    {#snippet after()}
      <p><em>Rendered after the body by the screen: comments, related stories.</em></p>
    {/snippet}
  </ArticleView>
</Example>

<Example title="Hero opted out">
  <ArticleView
    {article}
    mediaAssets={MEDIA_ASSETS}
    storageBaseUrl={STORAGE_BASE_URL}
    locale="en"
    hero={false}
    {dictionary}
  />
</Example>
