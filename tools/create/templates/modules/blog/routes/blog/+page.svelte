<script lang="ts">
  import { merge, localText } from '@sveltebuilder/hermes';
  import { Pagination } from '@sveltebuilder/coreui';
  import { PostList, CategoryPill, TagPill } from '@sveltebuilder/blog';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Merge post text into the hermes dictionary for client-side localText() resolution.
  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  const title    = $derived(localText('blog.post.list.title', 'blog'));
  const pageTitle = $derived(`${title} — ${localText('app.name')}`);

  let page = $state(data.page);

  const categoriesByPost = $derived(
    Object.fromEntries(
      data.posts.map((p) => [p.id, p.categories])
    )
  );

  const tagsByPost = $derived(
    Object.fromEntries(
      data.posts.map((p) => [p.id, p.tags])
    )
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={localText('blog.post.list.title', 'blog')} />

  <!-- hreflang alternates for multilingual SEO -->
  {#each data.locales as loc}
    <link rel="alternate" hreflang={loc.code} href={`/${loc.code}/blog`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="/blog" />

  <!-- RSS autodiscovery -->
  <link rel="alternate" type="application/rss+xml" title={title} href="/blog/rss.xml" />
</svelte:head>

<main class="blog-list-page">
  <header class="blog-list-page__header">
    <h1 class="blog-list-page__title">{title}</h1>
  </header>

  <!-- Category filter -->
  {#if data.categories.length > 0}
    <nav class="blog-list-page__filters" aria-label={localText('blog.admin.post.list.all', 'blog')}>
      <ul class="blog-list-page__filter-list">
        <li>
          <a
            href="/blog"
            class="blog-list-page__filter-all"
            aria-current={!data.categorySlug && !data.tagSlug ? 'page' : undefined}
          >{localText('blog.admin.post.list.all', 'blog')}</a>
        </li>
        {#each data.categories as category (category.id)}
          <li>
            <CategoryPill
              {category}
              locale={data.locale.code}
              href={`/blog?category=${category.slug}`}
            />
          </li>
        {/each}
      </ul>
    </nav>
  {/if}

  <PostList
    posts={data.posts}
    locale={data.locale.code}
    categories={categoriesByPost}
    tags={tagsByPost}
  />

  {#if data.total > data.perPage}
    <nav class="blog-list-page__pagination" aria-label={localText('nav.pagination')}>
      <Pagination
        count={data.total}
        perPage={data.perPage}
        bind:page
      />
    </nav>
  {/if}
</main>

<style>
  .blog-list-page {
    max-width: 48rem;
    margin-inline: auto;
    padding: var(--space-8) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .blog-list-page__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .blog-list-page__title {
    font-size: var(--text-4xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    color: var(--color-text-primary);
    margin: 0;
  }

  .blog-list-page__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .blog-list-page__filter-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .blog-list-page__filter-all {
    display: inline-flex;
    align-items: center;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: 0 var(--space-2);
    height: var(--badge-height-md);
    border-radius: var(--badge-radius);
    border: 1px solid var(--color-border-default);
    background-color: var(--color-surface-base);
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  .blog-list-page__filter-all:hover,
  .blog-list-page__filter-all[aria-current="page"] {
    background-color: var(--color-surface-overlay);
    color: var(--color-text-primary);
  }

  .blog-list-page__pagination {
    display: flex;
    justify-content: center;
  }
</style>
