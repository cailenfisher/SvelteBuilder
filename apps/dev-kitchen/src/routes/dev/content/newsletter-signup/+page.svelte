<script lang="ts">
  import { load as hermesLoad } from '@sveltebuilder/hermes';
  import { NewsletterSignup } from '@sveltebuilder/content';
  import { sampleNewsletter, fixtureDictionaryPayload } from '$lib/content-fixtures.js';

  hermesLoad(fixtureDictionaryPayload, 'en', 'en');
</script>

<svelte:head><title>NewsletterSignup — Dev Kitchen</title></svelte:head>

<div class="showcase">
  <h1>NewsletterSignup</h1>

  <section class="showcase-section">
    <h2>default</h2>
    <div style="max-width: 28rem;">
      <NewsletterSignup newsletter={sampleNewsletter} />
    </div>
  </section>

  <section class="showcase-section">
    <h2>success state</h2>
    <div style="max-width: 28rem;">
      <NewsletterSignup newsletter={sampleNewsletter} formResult={{ success: true }} />
    </div>
  </section>
</div>

<style>
  .showcase { display: flex; flex-direction: column; gap: 3rem; }
  h1 { margin-block-end: 1rem; }
  .showcase-section { display: flex; flex-direction: column; gap: 0.75rem; }
  h2 { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }
</style>
