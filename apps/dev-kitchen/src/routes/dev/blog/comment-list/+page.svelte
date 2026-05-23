<script lang="ts">
  import { CommentList } from '@sveltebuilder/blog';
  import { comments } from '$lib/blog-fixtures.js';

  // comments[2] is unapproved — show pending notice when viewing as that user
  const currentUserId = 'demo-user-3';
</script>

<svelte:head>
  <title>CommentList — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>CommentList</h1>

  <section class="dev-section">
    <h2>Empty state</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentList comments={[]} locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>With approved comments and nested reply</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentList
        comments={comments.filter(c => c.approved)}
        locale="en"
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>Pending moderation notice (logged in as author of unapproved comment)</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentList
        comments={comments}
        locale="en"
        currentUserId={currentUserId}
      />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--narrow { max-width: 42rem; }
</style>
