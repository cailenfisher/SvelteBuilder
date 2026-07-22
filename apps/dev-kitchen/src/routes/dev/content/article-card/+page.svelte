<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { ArticleCard } from '@sveltebuilder/content';
  import { sampleArticle, secondArticle, worldSection, techSection, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>ArticleCard — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>ArticleCard</h1>

  <section class="showcase-section">
    <h2>lead variant</h2>
    <div style="max-width: 32rem;">
      <ArticleCard
        article={sampleArticle}
        mediaAssets={new Map()}
        storageBaseUrl=""
        locale="en"
        sections={[worldSection]}
        variant="lead"
      />
    </div>
  </section>

  <section class="showcase-section">
    <h2>secondary variant</h2>
    <div style="max-width: 24rem;">
      <ArticleCard
        article={secondArticle}
        mediaAssets={new Map()}
        storageBaseUrl=""
        locale="en"
        sections={[techSection]}
        variant="secondary"
      />
    </div>
  </section>

  <section class="showcase-section">
    <h2>river variant</h2>
    <div style="max-width: 40rem; border: 1px solid var(--border-color);">
      <ArticleCard
        article={sampleArticle}
        mediaAssets={new Map()}
        storageBaseUrl=""
        locale="en"
        sections={[worldSection]}
        variant="river"
      />
      <ArticleCard
        article={secondArticle}
        mediaAssets={new Map()}
        storageBaseUrl=""
        locale="en"
        sections={[techSection]}
        variant="river"
      />
    </div>
  </section>

  <section class="showcase-section">
    <h2>brief variant</h2>
    <div style="max-width: 18rem;">
      <ArticleCard
        article={sampleArticle}
        mediaAssets={new Map()}
        storageBaseUrl=""
        locale="en"
        sections={[worldSection]}
        variant="brief"
      />
    </div>
  </section>
</div>

<style>
  .showcase { max-width: 60rem; display: flex; flex-direction: column; gap: 3rem; }
  h1 { margin-block-end: 1rem; }
  .showcase-section { display: flex; flex-direction: column; gap: 1rem; }
  h2 { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }
</style>
