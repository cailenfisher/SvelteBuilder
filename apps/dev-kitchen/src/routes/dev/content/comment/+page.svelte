<script lang="ts">
  import { CommentList } from '@sveltebuilder/content';
  import type { Comment } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';

  const comment = (id: number, authorName: string, body: string): Comment => ({
    id,
    articleId: 1,
    userAccountId: null,
    parentCommentId: null,
    authorName,
    authorEmail: `${authorName.split(' ')[0].toLowerCase()}@example.com`,
    body,
    status: 'approved',
    createdAt: '2026-10-07T10:00:00.000Z',
    updatedAt: '2026-10-07T10:00:00.000Z',
  });
</script>

<Example title="Two approved comments">
  <CommentList
    comments={[
      comment(1, 'Ada Lovelace', 'The harbour figures match what the port authority published.'),
      comment(2, 'Grace Hopper', 'Would like to see the same analysis for the river crossings.'),
    ]}
  />
</Example>
