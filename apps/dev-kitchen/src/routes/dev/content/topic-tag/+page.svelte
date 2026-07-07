<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { TopicTag } from '@sveltebuilder/content';
  import { climateTopic, aiTopic, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>TopicTag — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>TopicTag</h1>
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
    <TopicTag topic={climateTopic} locale="en" />
    <TopicTag topic={aiTopic} locale="en" />
  </div>
</div>

<style>
  .showcase { display: flex; flex-direction: column; gap: 2rem; }
  h1 { margin-block-end: 0.5rem; }
</style>
