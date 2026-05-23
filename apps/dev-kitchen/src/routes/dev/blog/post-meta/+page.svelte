<script lang="ts">
  import { PostMeta } from '@sveltebuilder/blog';
  import { posts } from '$lib/blog-fixtures.js';

  // post[0] has updatedAt different from publishedAt
  const withUpdate = posts[0];
  // post[1] has same publishedAt and updatedAt
  const noUpdate   = posts[1];
  // post[2] has no reading time
  const noReading  = { ...posts[2], readingTimeMinute: null };
</script>

<svelte:head>
  <title>PostMeta — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>PostMeta</h1>

  <section class="dev-section">
    <h2>Author, date, reading time, updated date</h2>
    <div class="dev-stage">
      <PostMeta post={withUpdate} authorName="Cailen Fisher" locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Author, date, reading time — no updated date</h2>
    <div class="dev-stage">
      <PostMeta post={noUpdate} authorName="Cailen Fisher" locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Author and date only — no reading time</h2>
    <div class="dev-stage">
      <PostMeta post={noReading} authorName="Alex Chen" locale="en" />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
