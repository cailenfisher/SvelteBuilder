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
  const byLabel = $derived(localText('blog.post.by', 'blog'));

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
    ['post-card', post.featured ? 'post-card--featured' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<article class={classes}>
  <div class="post-card__body">
    <header class="post-card__header">
      {#if showStatus}
        <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
      {/if}

      <h2 class="post-card__title">
        <a class="post-card__title-link" href={cardHref}>{title}</a>
      </h2>

      {#if publishedDate}
        <p class="post-card__meta">
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

    <p class="post-card__excerpt">{excerpt}</p>

    {#if categories.length > 0 || tags.length > 0}
      <footer class="post-card__footer">
        {#if categories.length > 0}
          <ul class="post-card__categories" aria-label="Categories">
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
          <ul class="post-card__tags" aria-label="Tags">
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
  .post-card {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    transition: box-shadow var(--duration-fast) var(--ease-out),
                border-color var(--duration-fast) var(--ease-out);
    overflow: hidden;
  }

  .post-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-strong);
  }

  .post-card--featured {
    border-color: var(--color-border-brand);
  }

  .post-card__body {
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .post-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .post-card__title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--color-text-primary);
    margin: 0;
  }

  .post-card__title-link {
    color: inherit;
    text-decoration: none;
  }

  .post-card__title-link:hover {
    color: var(--color-text-link);
  }

  .post-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .post-card__excerpt {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-text-secondary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-card__footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  .post-card__categories,
  .post-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
