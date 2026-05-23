<script lang="ts">
  import { ProgressBar } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>ProgressBar — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>ProgressBar</h1>

  <!-- verify: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax on root -->

  <section class="dev-section">
    <h2>All sizes</h2>
    <div class="dev-stage">
      <ProgressBar size="sm" value={60} label="Small progress" />
      <ProgressBar size="md" value={60} label="Medium progress" />
      <ProgressBar size="lg" value={60} label="Large progress" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Values — 0%, 25%, 50%, 75%, 100%</h2>
    <div class="dev-stage">
      <ProgressBar value={0} label="0% complete" />
      <ProgressBar value={25} label="25% complete" />
      <ProgressBar value={50} label="50% complete" />
      <ProgressBar value={75} label="75% complete" />
      <ProgressBar value={100} label="100% complete" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Indeterminate (value not provided)</h2>
    <div class="dev-stage">
      <ProgressBar label="Loading…" />
    </div>
  </section>

  <section class="dev-section">
    <h2>With label prop (ARIA only — not rendered visually)</h2>
    <div class="dev-stage">
      <ProgressBar value={42} label="File upload progress" />
      <p style="font-size: 0.875rem; margin-top: 0.5rem;">verify: aria-label="File upload progress" on the progressbar element</p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
