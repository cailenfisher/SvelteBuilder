<script lang="ts">
  import { PostStatusBadge } from '@sveltebuilder/blog';
</script>

<svelte:head>
  <title>PostStatusBadge — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>PostStatusBadge</h1>

  <section class="dev-section">
    <h2>All statuses</h2>
    <div class="dev-stage dev-stage--row">
      <PostStatusBadge status="published" label="Published" />
      <PostStatusBadge status="review"    label="In Review" />
      <PostStatusBadge status="draft"     label="Draft" />
      <PostStatusBadge status="archived"  label="Archived" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Camp 1 — caller supplies the label string</h2>
    <p class="note">
      PostStatusBadge is a Camp 1 component: it has no hermes import. The consuming
      page resolves the label (e.g. via localText) and passes it as a plain string.
    </p>
    <div class="dev-stage dev-stage--row">
      <PostStatusBadge status="published" label="Publié" />
      <PostStatusBadge status="draft"     label="Brouillon" />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
  .note { font-size: 0.875rem; color: #666; margin-block-end: 0.75rem; }
</style>
