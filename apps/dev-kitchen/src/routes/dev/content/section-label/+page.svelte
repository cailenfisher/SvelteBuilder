<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { SectionLabel } from '@sveltebuilder/content';
  import { worldSection, techSection, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>SectionLabel — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>SectionLabel</h1>
  <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
    <SectionLabel section={worldSection} locale="en" />
    <SectionLabel section={techSection} locale="en" />
  </div>
</div>

<style>
  .showcase { display: flex; flex-direction: column; gap: 2rem; }
  h1 { margin-block-end: 0.5rem; }
</style>
