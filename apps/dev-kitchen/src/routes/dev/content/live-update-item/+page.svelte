<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { LiveUpdateItem } from '@sveltebuilder/content';
  import { sampleLiveCoverage, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>LiveUpdateItem — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>LiveUpdateItem</h1>
  <div style="max-width: 36rem; display:flex;flex-direction:column;gap:1rem;">
    {#each sampleLiveCoverage.updates as update (update.id)}
      <LiveUpdateItem {update} locale="en" />
    {/each}
  </div>
</div>

<style>
  .showcase { display: flex; flex-direction: column; gap: 2rem; }
  h1 { margin-block-end: 0.5rem; }
</style>
