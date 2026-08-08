<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { ArticleView } from '@sveltebuilder/content';
  import { sampleArticle, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>ArticleView — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>ArticleView</h1>
  <ArticleView
    article={sampleArticle}
    mediaAssets={new Map()}
    storageBaseUrl=""
    locale="en"
  />
</div>

<style>
  .showcase { max-width: 72ch; display: flex; flex-direction: column; gap: 2rem; }
  h1 { margin-block-end: 0.5rem; }
</style>
