<script lang="ts">
  import { PostList } from '@sveltebuilder/blog';
  import { posts, postCategories, postTags, categories } from '$lib/blog-fixtures.js';
  import type { LayoutData } from '../$types';

  let { data }: { data: LayoutData } = $props();

  const publishedPosts = posts.filter(p => p.status === 'published');
</script>

<svelte:head>
  <title>Blog — Dev Kitchen</title>
</svelte:head>

<div class="blog-index">
  <header class="blog-index__header">
    <h1>Blog</h1>
    <p class="blog-index__description">
      A demo of the <code>@sveltebuilder/blog</code> module — all text
      resolved via hermes, all data from local fixture files.
    </p>
  </header>

  <nav class="blog-index__categories" aria-label="Filter by category">
    <a href="/blog" class="category-link">All posts</a>
    {#each categories as cat (cat.id)}
      <a href="/blog?category={cat.slug}" class="category-link">{cat.slug}</a>
    {/each}
  </nav>

  <PostList
    posts={publishedPosts}
    locale={data.locale.code}
    categories={postCategories}
    tags={postTags}
  />
</div>

<style>
  .blog-index__header {
    margin-block-end: 2rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-block-end: 0.5rem;
  }

  .blog-index__description {
    color: #555;
    font-size: 0.9375rem;
    margin: 0;
  }

  .blog-index__categories {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-block-end: 2rem;
  }

  .category-link {
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 9999px;
    text-decoration: none;
    opacity: 0.7;
    transition: opacity 0.1s;
  }

  .category-link:hover {
    opacity: 1;
  }
</style>
