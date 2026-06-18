<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Badge } from '@sveltebuilder/coreui';
  import CategoryPill from './CategoryPill.svelte';
  import TagPill from './TagPill.svelte';
  import type { Post, PostCategory, PostTag } from '../schema/index.js';

  type Props = {
    post: Post;
    locale: string;
    categories?: PostCategory[];
    tags?: PostTag[];
    href?: string;
    showStatus?: boolean;
    class?: string | undefined;
  };

  let {
    post,
    locale,
    categories = [],
    tags = [],
    href,
    showStatus = false,
    class: extraClass,
  }: Props = $props();

  const title   = $derived(localText('title',   'post', post.id));
  const excerpt = $derived(localText('excerpt', 'post', post.id));

  const publishedDate = $derived(
    post.publishedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(post.publishedAt))
      : null
  );

  const statusVariant = $derived(
    post.status === 'published' ? 'success'
    : post.status === 'review'  ? 'warning'
    : post.status === 'archived'? 'default'
    : 'default'
  );

  const statusLabel = $derived(localText(`blog.status.${post.status}`, 'blog'));

  const cardHref = $derived(href ?? `/blog/${post.slug}`);

  const classes = $derived(
    ['post-card', post.featured ? 'featured' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<article class={classes}>
  <div class="body">
    <header class="header">
      {#if showStatus}
        <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
      {/if}

      <h2 class="title">
        <a class="title-link" href={cardHref}>{title}</a>
      </h2>

      {#if publishedDate}
        <p class="meta">
          <time datetime={post.publishedAt ?? undefined}>{publishedDate}</time>
          {#if post.readingTimeMinute}
            <span aria-hidden="true">·</span>
            <span>
              {localText('blog.reading_time', 'blog').replace('{minutes}', String(post.readingTimeMinute))}
            </span>
          {/if}
        </p>
      {/if}
    </header>

    <p class="excerpt">{excerpt}</p>

    {#if categories.length > 0 || tags.length > 0}
      <footer class="footer">
        {#if categories.length > 0}
          <ul class="categories" aria-label="Categories">
            {#each categories as category (category.id)}
              <li>
                <CategoryPill
                  {category}
                  {locale}
                  href={`/blog?category=${category.slug}`}
                />
              </li>
            {/each}
          </ul>
        {/if}

        {#if tags.length > 0}
          <ul class="tags" aria-label="Tags">
            {#each tags as tag (tag.id)}
              <li>
                <TagPill
                  {tag}
                  {locale}
                  href={`/blog?tag=${tag.slug}`}
                />
              </li>
            {/each}
          </ul>
        {/if}
      </footer>
    {/if}
  </div>
</article>

<style>
  /* @layer chrome provides base .card chrome */
  .post-card {
    background: var(--surface-raised);
    border: var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xs);
    transition: box-shadow var(--duration) var(--ease), border-color var(--duration) var(--ease);
    overflow: hidden;
  }

  .post-card:hover {
    box-shadow: var(--shadow);
    border-color: var(--border-strong);
  }

  .post-card.featured {
    border-color: color-mix(in srgb, var(--brand), white 65%);
  }

  .body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--text);
    margin: 0;
  }

  .title-link {
    color: inherit;
    text-decoration: none;
  }
  .title-link:hover { color: var(--link-text); }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
  }

  .excerpt {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--text-soft);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  .categories,
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
