<script lang="ts">
  import { PostBody } from '@sveltebuilder/blog';
</script>

<svelte:head>
  <title>PostBody — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>PostBody</h1>

  <section class="dev-section">
    <h2>Full post body (post 1) — headings, lists, blockquote, code block</h2>
    <div class="dev-stage">
      <PostBody postId={1} locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Post body with code snippets (post 2)</h2>
    <div class="dev-stage">
      <PostBody postId={2} locale="en" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Short post body (post 3)</h2>
    <div class="dev-stage">
      <PostBody postId={3} locale="en" />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
