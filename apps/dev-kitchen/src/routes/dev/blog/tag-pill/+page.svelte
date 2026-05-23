<script lang="ts">
  import { TagPill } from '@sveltebuilder/blog';
  import { tags } from '$lib/blog-fixtures.js';
</script>

<svelte:head>
  <title>TagPill — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>TagPill</h1>

  <section class="dev-section">
    <h2>As span (no href)</h2>
    <div class="dev-stage dev-stage--row">
      {#each tags as tag (tag.id)}
        <TagPill {tag} locale="en" />
      {/each}
    </div>
  </section>

  <section class="dev-section">
    <h2>As link (with href)</h2>
    <div class="dev-stage dev-stage--row">
      {#each tags as tag (tag.id)}
        <TagPill {tag} locale="en" href={`/blog?tag=${tag.slug}`} />
      {/each}
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
</style>
