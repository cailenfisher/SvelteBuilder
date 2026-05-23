<script lang="ts">
  import { CategoryPill } from '@sveltebuilder/blog';
  import { categories } from '$lib/blog-fixtures.js';
</script>

<svelte:head>
  <title>CategoryPill — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>CategoryPill</h1>

  <section class="dev-section">
    <h2>As span (no href)</h2>
    <div class="dev-stage dev-stage--row">
      <CategoryPill category={categories[0]} locale="en" />
      <CategoryPill category={categories[1]} locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>As link (with href)</h2>
    <div class="dev-stage dev-stage--row">
      <CategoryPill category={categories[0]} locale="en" href="/blog?category=technology" />
      <CategoryPill category={categories[1]} locale="en" href="/blog?category=design" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Multiple in a row</h2>
    <div class="dev-stage dev-stage--row">
      {#each categories as category (category.id)}
        <CategoryPill
          {category}
          locale="en"
          href={`/blog?category=${category.slug}`}
        />
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
