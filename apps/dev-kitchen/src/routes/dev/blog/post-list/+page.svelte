<script lang="ts">
  import { PostList } from '@sveltebuilder/blog';
  import { posts, postCategories, postTags } from '$lib/blog-fixtures.js';
</script>

<svelte:head>
  <title>PostList — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>PostList</h1>

  <section class="dev-section">
    <h2>Loading state</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostList posts={[]} locale="en" loading />
    </div>
  </section>

  <section class="dev-section">
    <h2>Empty state</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostList posts={[]} locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Published posts with categories and tags</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostList
        posts={posts.filter(p => p.status === 'published')}
        locale="en"
        categories={postCategories}
        tags={postTags}
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>Single post, no taxonomy</h2>
    <div class="dev-stage dev-stage--narrow">
      <PostList posts={[posts[0]]} locale="en" />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--narrow { max-width: 42rem; }
</style>
