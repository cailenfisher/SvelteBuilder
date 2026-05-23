<script lang="ts">
  import { CommentForm } from '@sveltebuilder/blog';

  let submitted = $state<string | null>(null);
  let loading   = $state(false);
  let error     = $state<string | undefined>(undefined);

  function handleSubmit(body: string) {
    submitted = body;
  }

  function handleLoadingSubmit(_body: string) {
    loading = true;
  }

  function handleErrorSubmit(_body: string) {
    error = 'Something went wrong. Please try again.';
  }
</script>

<svelte:head>
  <title>CommentForm — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>CommentForm</h1>

  <section class="dev-section">
    <h2>Default state</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentForm
        label="Leave a comment"
        submitLabel="Post comment"
        onsubmit={handleSubmit}
      />
      {#if submitted}
        <p class="result">Submitted: "{submitted}"</p>
      {/if}
    </div>
  </section>

  <section class="dev-section">
    <h2>With cancel button</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentForm
        label="Reply"
        submitLabel="Post reply"
        cancelLabel="Cancel"
        onsubmit={handleSubmit}
        oncancel={() => {}}
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>Loading state (submit to trigger)</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentForm
        label="Leave a comment"
        submitLabel="Post comment"
        loading={loading}
        onsubmit={handleLoadingSubmit}
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>Error state (submit to trigger)</h2>
    <div class="dev-stage dev-stage--narrow">
      <CommentForm
        label="Leave a comment"
        submitLabel="Post comment"
        error={error}
        onsubmit={handleErrorSubmit}
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
  .dev-stage--narrow { max-width: 36rem; }
  .result { margin-block-start: 1rem; font-size: 0.875rem; color: #555; font-style: italic; }
</style>
