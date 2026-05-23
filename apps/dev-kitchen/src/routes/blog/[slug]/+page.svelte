<script lang="ts">
  import {
    PostMeta,
    PostBody,
    PostStatusBadge,
    CategoryPill,
    TagPill,
    CommentList,
    CommentForm,
  } from '@sveltebuilder/blog';
  import { localText } from '@sveltebuilder/hermes';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const title      = $derived(localText('title',   'post', data.post.id));
  const statusLabel = $derived(localText(`blog.status.${data.post.status}`, 'blog'));

  let submitted = $state(false);

  function handleCommentSubmit(_body: string) {
    submitted = true;
  }
</script>

<svelte:head>
  <title>{title} — Dev Kitchen Blog</title>
</svelte:head>

<article class="post">
  <header class="post__header">
    <a class="post__back" href="/blog">← All posts</a>

    <div class="post__meta-row">
      <PostStatusBadge status={data.post.status} label={statusLabel} />

      {#if data.categories.length > 0}
        <ul class="post__pills" aria-label="Categories">
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
      {/if}

      {#if data.tags.length > 0}
        <ul class="post__pills" aria-label="Tags">
          {#each data.tags as tag (tag.id)}
            <li>
              <TagPill
                {tag}
                locale={data.locale.code}
                href={`/blog?tag=${tag.slug}`}
              />
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <h1 class="post__title">{title}</h1>

    <PostMeta
      post={data.post}
      authorName="Cailen Fisher"
      locale={data.locale.code}
    />
  </header>

  <PostBody postId={data.post.id} locale={data.locale.code} />

  <footer class="post__footer">
    <hr class="post__divider" />

    <section class="post__comments">
      <h2>Comments</h2>

      <CommentList
        comments={data.comments}
        locale={data.locale.code}
      />

      {#if data.post.allowComment}
        {#if submitted}
          <p class="post__comment-thanks">
            Comment submitted — pending moderation.
          </p>
        {:else}
          <div class="post__comment-form">
            <CommentForm
              label="Leave a comment"
              submitLabel="Post comment"
              onsubmit={handleCommentSubmit}
            />
          </div>
        {/if}
      {:else}
        <p class="post__comments-closed">Comments are closed for this post.</p>
      {/if}
    </section>
  </footer>
</article>

<style>
  .post__back {
    display: inline-block;
    font-size: 0.875rem;
    margin-block-end: 1.5rem;
    opacity: 0.6;
    text-decoration: none;
  }

  .post__back:hover {
    opacity: 1;
  }

  .post__header {
    margin-block-end: 2.5rem;
  }

  .post__meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-block-end: 1rem;
  }

  .post__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .post__title {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 0.75rem;
  }

  .post__footer {
    margin-block-start: 3rem;
  }

  .post__divider {
    border: none;
    border-top: 1px solid currentColor;
    opacity: 0.2;
    margin-block-end: 2.5rem;
  }

  .post__comments h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-block-end: 1.5rem;
  }

  .post__comment-form {
    margin-block-start: 2rem;
    max-width: 36rem;
  }

  .post__comment-thanks,
  .post__comments-closed {
    font-size: 0.9375rem;
    color: #555;
    margin-block-start: 1.5rem;
  }
</style>
