<script lang="ts">
  import { PostCard } from '@sveltebuilder/blog';
  import { posts, categories, tags } from '$lib/blog-fixtures.js';

  const featured = posts[0];   // featured, published, reading time, updated different from published
  const regular  = posts[1];   // regular published, categories + tags
  const minimal  = posts[2];   // no featured, comments off
  const draft: typeof posts[0] = {
    ...posts[3],
    status: 'draft',
  };
</script>

<svelte:head>
  <title>PostCard — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>PostCard</h1>

  <section class="dev-section">
    <h2>Featured post</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostCard
        post={featured}
        locale="en"
        categories={[categories[0]]}
        tags={[tags[0], tags[1]]}
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>Regular post with multiple categories and tags</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostCard
        post={regular}
        locale="en"
        categories={[categories[0], categories[1]]}
        tags={[tags[1], tags[2]]}
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>With status badge (showStatus)</h2>
    <div class="dev-stage dev-stage--row">
      <div style="flex: 1; min-width: 18rem;">
        <PostCard post={featured} locale="en" showStatus />
      </div>
      <div style="flex: 1; min-width: 18rem;">
        <PostCard post={draft} locale="en" showStatus />
      </div>
    </div>
  </section>

  <section class="dev-section">
    <h2>Minimal — no categories, no tags, no reading time</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostCard post={minimal} locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Custom href</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostCard
        post={featured}
        locale="en"
        href="/blog/building-with-svelte-5-runes"
        categories={[categories[0]]}
      />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; }
  .dev-stage--narrow { max-width: 36rem; }
</style>
