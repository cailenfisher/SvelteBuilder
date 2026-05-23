<script lang="ts">
  import { ReadingTime } from '@sveltebuilder/blog';
</script>

<svelte:head>
  <title>ReadingTime — Blog Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>ReadingTime</h1>

  <section class="dev-section">
    <h2>Various durations</h2>
    <div class="dev-stage dev-stage--row">
      <ReadingTime minutes={1}  label="1 min read" />
      <ReadingTime minutes={5}  label="5 min read" />
      <ReadingTime minutes={8}  label="8 min read" />
      <ReadingTime minutes={12} label="12 min read" />
      <ReadingTime minutes={25} label="25 min read" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Camp 1 — caller supplies the interpolated label</h2>
    <p class="note">
      ReadingTime is a Camp 1 component. The consuming page interpolates {'{minutes}'}
      into the localText string and passes the result as a plain string.
    </p>
    <div class="dev-stage dev-stage--row">
      <ReadingTime minutes={8}  label="8 minutes de lecture" />
      <ReadingTime minutes={12} label="12 Minuten Lesezeit" />
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
  .note { font-size: 0.875rem; color: #666; margin-block-end: 0.75rem; }
</style>
