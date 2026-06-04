<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import type { CommentWithAuthor } from '../schema/index.js';

  type Props = {
    comments: CommentWithAuthor[];
    locale: string;
    currentUserId?: string;
    class?: string | undefined;
  };

  let { comments, locale, currentUserId, class: extraClass }: Props = $props();

  const pendingLabel = $derived(localText('blog.comment.pending', 'blog'));

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }

  // Show pending notice if the comment belongs to the current user and is unapproved.
  function showPending(comment: CommentWithAuthor): boolean {
    return !comment.approved && comment.userAccountId === currentUserId;
  }

  const classes = $derived(
    ['comment-list', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<section class={classes} aria-label="Comments">
  {#if comments.length === 0}
    <p class="comment-list__empty">{localText('blog.post.list.empty', 'blog')}</p>
  {:else}
    {#each comments as comment (comment.id)}
      <article class="comment-list__comment">
        <header class="comment-list__comment-header">
          <span class="comment-list__author">
            {comment.authorDisplayName ?? 'Anonymous'}
          </span>
          <time
            class="comment-list__date"
            datetime={comment.createdAt}
          >{formatDate(comment.createdAt)}</time>
        </header>

        <!-- SCOPE DEVIATION: body is user-generated plain text, not LocalText. Rendered as text, not HTML. -->
        <p class="comment-list__body">{comment.body}</p>

        {#if showPending(comment)}
          <p class="comment-list__pending" role="status">{pendingLabel}</p>
        {/if}

        {#if comment.replies.length > 0}
          <div class="comment-list__replies">
            {#each comment.replies as reply (reply.id)}
              <article class="comment-list__comment comment-list__comment--reply">
                <header class="comment-list__comment-header">
                  <span class="comment-list__author">
                    {reply.authorDisplayName ?? 'Anonymous'}
                  </span>
                  <time
                    class="comment-list__date"
                    datetime={reply.createdAt}
                  >{formatDate(reply.createdAt)}</time>
                </header>
                <p class="comment-list__body">{reply.body}</p>
                {#if showPending(reply)}
                  <p class="comment-list__pending" role="status">{pendingLabel}</p>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </article>
    {/each}
  {/if}
</section>

<style>
  .comment-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .comment-list__empty {
    color: var(--text-soft);
    font-size: var(--text-sm);
    margin: 0;
  }

  .comment-list__comment {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    background-color: var(--surface-raised);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
  }

  .comment-list__comment--reply {
    background-color: var(--surface);
    border-color: var(--border-color);
  }

  .comment-list__comment-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .comment-list__author {
    font-weight: var(--weight-semibold);
    font-size: var(--text-sm);
    color: var(--text);
  }

  .comment-list__date {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .comment-list__body {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--text);
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .comment-list__pending {
    font-size: var(--text-xs);
    color: var(--warning-text);
    background-color: var(--warning-soft);
    border: 1px solid var(--warning-border);
    border-radius: var(--radius-md);
    padding: var(--space-1) var(--space-2);
    margin: 0;
  }

  .comment-list__replies {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-block-start: var(--space-3);
    padding-inline-start: var(--space-4);
    border-inline-start: 2px solid var(--border-color);
  }
</style>
