<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import type { Post } from '../schema/index.js';

  type Props = {
    post: Post;
    authorName: string;
    locale: string;
    class?: string | undefined;
  };

  let { post, authorName, locale, class: extraClass }: Props = $props();

  const publishedDate = $derived(
    post.publishedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(post.publishedAt))
      : null
  );

  const updatedDate = $derived(
    post.updatedAt !== post.publishedAt
      ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(post.updatedAt))
      : null
  );

  // Interpolate {author} into the resolved string
  const byLine = $derived(
    localText('blog.post.by', 'blog').replace('{author}', authorName)
  );

  const readingTimeLabel = $derived(
    post.readingTimeMinute
      ? localText('blog.reading_time', 'blog').replace('{minutes}', String(post.readingTimeMinute))
      : null
  );

  const updatedLabel = $derived(
    updatedDate
      ? localText('blog.post.updated', 'blog').replace('{date}', updatedDate)
      : null
  );

  const classes = $derived(
    ['post-meta', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<dl class={classes}>
  <div class="post-meta__item">
    <dt class="post-meta__label sr-only">Author</dt>
    <dd class="post-meta__value">{byLine}</dd>
  </div>

  {#if publishedDate}
    <div class="post-meta__item">
      <dt class="post-meta__label sr-only">Published</dt>
      <dd class="post-meta__value">
        <time datetime={post.publishedAt ?? undefined}>{publishedDate}</time>
      </dd>
    </div>
  {/if}

  {#if readingTimeLabel}
    <div class="post-meta__item">
      <dt class="post-meta__label sr-only">Reading time</dt>
      <dd class="post-meta__value">{readingTimeLabel}</dd>
    </div>
  {/if}

  {#if updatedLabel}
    <div class="post-meta__item">
      <dt class="post-meta__label sr-only">Updated</dt>
      <dd class="post-meta__value post-meta__value--secondary">{updatedLabel}</dd>
    </div>
  {/if}
</dl>

<style>
  .post-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .post-meta__item {
    display: contents;
  }

  .post-meta__label {
    /* Visually hidden — for screen readers only */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .post-meta__value {
    margin: 0;
  }

  .post-meta__value--secondary {
    color: var(--color-text-tertiary);
    font-size: var(--text-xs);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
