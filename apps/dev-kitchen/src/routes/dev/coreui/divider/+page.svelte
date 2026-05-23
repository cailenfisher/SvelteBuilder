<script lang="ts">
  import { Divider } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Divider — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Divider</h1>

  <section class="dev-section">
    <h2>Horizontal (default)</h2>
    <div class="dev-stage">
      <p>Content above the divider.</p>
      <Divider />
      <p>Content below the divider.</p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Vertical (needs flex container)</h2>
    <div class="dev-stage" style="display: flex; align-items: stretch; gap: 1rem; height: 3rem;">
      <span>Left content</span>
      <Divider orientation="vertical" />
      <span>Right content</span>
      <Divider orientation="vertical" />
      <span>Third section</span>
    </div>
  </section>

  <section class="dev-section">
    <h2>decorative={false}</h2>
    <div class="dev-stage">
      <!-- role="separator" for meaningful divisions — screen readers announce this -->
      <p>Section A — meaningful content grouping</p>
      <Divider decorative={false} />
      <p>Section B — the divider above has role="separator" in the DOM</p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
