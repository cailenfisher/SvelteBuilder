<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { BylineList } from '@sveltebuilder/content';
  import { janeAuthor, johnAuthor, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>BylineList — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>BylineList</h1>

  <section class="showcase-section">
    <h2>single author</h2>
    <BylineList bylines={[janeAuthor]} locale="en" />
  </section>

  <section class="showcase-section">
    <h2>two authors</h2>
    <BylineList bylines={[janeAuthor, johnAuthor]} locale="en" />
  </section>
</div>

<style>
  .showcase { display: flex; flex-direction: column; gap: 2rem; }
  h1 { margin-block-end: 1rem; }
  .showcase-section { display: flex; flex-direction: column; gap: 0.5rem; }
  h2 { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }
</style>
