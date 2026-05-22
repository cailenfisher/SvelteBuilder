<script lang="ts">
  import { Spinner } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Spinner — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Spinner</h1>

  <!-- verify: role="status" on root span, aria-label announces label text -->

  <section class="dev-section">
    <h2>All sizes</h2>
    <div class="dev-stage dev-stage--row">
      <div class="labeled">
        <Spinner size="sm" />
        <span>sm</span>
      </div>
      <div class="labeled">
        <Spinner size="md" />
        <span>md</span>
      </div>
      <div class="labeled">
        <Spinner size="lg" />
        <span>lg</span>
      </div>
    </div>
  </section>

  <section class="dev-section">
    <h2>Custom label</h2>
    <div class="dev-stage dev-stage--row">
      <Spinner label="Uploading file…" />
      <Spinner label="Saving changes…" />
      <Spinner label="Processing…" />
    </div>
    <p style="margin-top: 0.5rem; font-size: 0.875rem;">verify: aria-label on each spinner reads the custom label text</p>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; }
  .labeled { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .labeled span { font-size: 0.75rem; opacity: 0.6; }
</style>
