<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Skeleton } from '@sveltebuilder/coreui';
  import PostCard from './PostCard.svelte';
  import type { Post, PostCategory, PostTag } from '../schema/index.js';

  type Props = {
    posts: Post[];
    locale: string;
    categories?: Record<string, PostCategory[]>;
    tags?: Record<string, PostTag[]>;
    loading?: boolean;
    class?: string | undefined;
  };

  let {
    posts,
    locale,
    categories = {},
    tags = {},
    loading = false,
    class: extraClass,
  }: Props = $props();

  const emptyLabel = $derived(localText('blog.post.list.empty', 'blog'));

  const classes = $derived(
    ['post-list', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

{#if loading}
  <div
    class="post-list post-list--loading"
    role="status"
    aria-label="Loading posts"
    aria-live="polite"
  >
    {#each { length: 3 } as _}
      <div class="post-list__skeleton-card">
        <Skeleton height="1.25rem" width="60%" />
        <Skeleton height="0.875rem" width="30%" />
        <Skeleton height="4rem" />
        <div class="post-list__skeleton-pills">
          <Skeleton height="1.5rem" width="5rem" />
          <Skeleton height="1.5rem" width="4rem" />
        </div>
      </div>
    {/each}
  </div>
{:else if posts.length === 0}
  <p class="post-list__empty">{emptyLabel}</p>
{:else}
  <ul class={classes} aria-label="Blog posts">
    {#each posts as post (post.id)}
      <li>
        <PostCard
          {post}
          {locale}
          categories={categories[post.id] ?? []}
          tags={tags[post.id] ?? []}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .post-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .post-list--loading {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .post-list__skeleton-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--card-padding);
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
  }

  .post-list__skeleton-pills {
    display: flex;
    gap: var(--space-2);
  }

  .post-list__empty {
    color: var(--color-text-secondary);
    font-size: var(--text-base);
    margin: var(--space-8) 0;
    text-align: center;
  }
</style>
