<!-- Readers' comments in the order given: who wrote each one and what they said. Both are the
     reader's own words, not copy, so nothing here is resolved from a dictionary. -->
<script lang="ts">
  import type { Comment } from '../schema/index.js';

  type Props = {
    comments: Comment[];
    class?: string | undefined;
  };

  let { comments, class: extraClass }: Props = $props();

  const classes = $derived(['comment-list', extraClass ?? ''].filter(Boolean).join(' '));
</script>

<ol class={classes}>
  {#each comments as comment (comment.id)}
    <li class="comment-list__comment">
      <p class="comment-list__author">{comment.authorName}</p>
      <p class="comment-list__body">{comment.body}</p>
    </li>
  {/each}
</ol>
