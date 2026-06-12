<script lang="ts">
  import { merge, localText } from '@sveltebuilder/hermes';
  import { PostBody, PostMeta, CategoryPill, TagPill, CommentList, CommentForm } from '@sveltebuilder/blog';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Merge this post's text into the hermes dictionary.
  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  const title   = $derived(localText(`title.${data.post.id}`, 'post'));
  const excerpt = $derived(localText(`excerpt.${data.post.id}`, 'post'));

  const commentFormTitle  = $derived(localText('blog.comment.form.title', 'blog'));
  const commentSubmitLabel = $derived(localText('blog.comment.form.submit', 'blog'));
  const commentCancelLabel = $derived(localText('blog.comment.form.cancel', 'blog'));

  const commentCount = $derived(
    localText('blog.post.detail.comment_count', 'blog')
      .replace('{count}', String(data.comments.length))
  );

  let commentError = $state<string | undefined>(undefined);
  let commentSubmitting = $state(false);
  let commentSubmitted = $state(false);

  async function handleCommentSubmit(body: string) {
    commentSubmitting = true;
    commentError = undefined;
    try {
      const res = await fetch('/api/blog/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: data.post.id, body }),
      });
      if (!res.ok) throw new Error('Failed to submit comment.');
      commentSubmitted = true;
    } catch (e) {
      commentError = e instanceof Error ? e.message : 'Something went wrong.';
    } finally {
      commentSubmitting = false;
    }
  }

  const canonicalUrl = $derived(
    typeof window !== 'undefined'
      ? `${window.location.origin}/blog/${encodeURIComponent(title)}`
      : `/blog/${encodeURIComponent(title)}`
  );

  const jsonLd = $derived(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    datePublished: data.post.publishedAt,
    dateModified: data.post.updatedAt,
    author: {
      '@type': 'Person',
      name: data.authorName,
    },
  }));

  // Build the script tag in JS to prevent the Svelte template parser from
  // misinterpreting the literal <script> substring as a script element.
  const jsonLdScript = $derived(`<` + `script type="application/ld+json">${jsonLd}</` + `script>`);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={excerpt} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={excerpt} />
  <meta property="og:url" content={canonicalUrl} />
  {#if data.post.publishedAt}
    <meta property="article:published_time" content={data.post.publishedAt} />
  {/if}
  <meta property="article:modified_time" content={data.post.updatedAt} />

  <!-- hreflang alternates -->
  {#each data.locales as loc}
    <link rel="alternate" hreflang={loc.code} href={`/${loc.code}/blog/${encodeURIComponent(title)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={`/blog/${encodeURIComponent(title)}`} />

  <!-- JSON-LD structured data -->
  {@html jsonLdScript}
</svelte:head>

<main class="blog-post-page">
  <article class="blog-post">
    <header class="blog-post__header">
      <h1 class="blog-post__title">{title}</h1>

      <PostMeta
        post={data.post}
        authorName={data.authorName}
        locale={data.locale.code}
      />

      {#if data.post.categories.length > 0 || data.post.tags.length > 0}
        <div class="blog-post__taxonomy">
          {#if data.post.categories.length > 0}
            <ul class="blog-post__categories" aria-label="Categories">
              {#each data.post.categories as category (category.id)}
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

          {#if data.post.tags.length > 0}
            <ul class="blog-post__tags" aria-label="Tags">
              {#each data.post.tags as tag (tag.id)}
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
      {/if}
    </header>

    <PostBody postId={data.post.id} locale={data.locale.code} />
  </article>

  {#if data.post.allowComment}
    <section class="blog-post__comments" aria-label="Comments">
      <h2 class="blog-post__comments-title">{commentCount}</h2>

      <CommentList
        comments={data.comments}
        locale={data.locale.code}
        currentUserId={data.user?.id}
      />

      {#if data.session}
        {#if commentSubmitted}
          <p class="blog-post__comment-pending" role="status">
            {localText('blog.comment.pending', 'blog')}
          </p>
        {:else}
          <CommentForm
            label={commentFormTitle}
            submitLabel={commentSubmitLabel}
            cancelLabel={commentCancelLabel}
            loading={commentSubmitting}
            error={commentError}
            onsubmit={handleCommentSubmit}
          />
        {/if}
      {:else}
        <p class="blog-post__sign-in-prompt">
          <a href="/sign-in">{localText('user.sign_in')}</a>
          {' '}to leave a comment.
        </p>
      {/if}
    </section>
  {/if}
</main>

<style>
  .blog-post-page {
    max-width: 48rem;
    margin-inline: auto;
    padding: var(--space-8) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
  }

  .blog-post {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .blog-post__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-block-end: var(--space-6);
    border-block-end: 1px solid var(--border-color);
  }

  .blog-post__title {
    font-size: var(--text-4xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    color: var(--text);
    margin: 0;
  }

  .blog-post__taxonomy {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
  }

  .blog-post__categories,
  .blog-post__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .blog-post__comments {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding-block-start: var(--space-8);
    border-block-start: 1px solid var(--border-color);
  }

  .blog-post__comments-title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: 0;
  }

  .blog-post__comment-pending {
    font-size: var(--text-sm);
    color: var(--warning-text);
    background-color: var(--warning-soft);
    border: 1px solid var(--warning-border);
    border-radius: var(--radius-lg);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .blog-post__sign-in-prompt {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
  }

  .blog-post__sign-in-prompt a {
    color: var(--link-text);
    text-decoration: underline;
  }
</style>
