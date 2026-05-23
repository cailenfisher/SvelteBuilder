<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { blogDictionaryPayload } from '$lib/blog-fixtures.js';

  let { children }: { children: any } = $props();

  $effect(() => {
    merge(blogDictionaryPayload, 'en', 'en');
  });
</script>

<div class="blog-layout">
  <header class="blog-layout__header">
    <a class="blog-layout__brand" href="/blog">The Kitchen Blog</a>
    <nav class="blog-layout__nav">
      <a href="/dev/blog">Component tests →</a>
    </nav>
  </header>

  <main class="blog-layout__main">
    {@render children()}
  </main>
</div>

<style>
  .blog-layout {
    max-width: 52rem;
    margin-inline: auto;
    padding-inline: 1.5rem;
  }

  .blog-layout__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: 1.5rem;
    border-bottom: 1px solid currentColor;
    margin-block-end: 3rem;
  }

  .blog-layout__brand {
    font-weight: 700;
    font-size: 1.25rem;
    text-decoration: none;
  }

  .blog-layout__nav {
    font-size: 0.875rem;
    opacity: 0.6;
  }

  .blog-layout__main {
    padding-block-end: 4rem;
  }
</style>
