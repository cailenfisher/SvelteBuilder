<script lang="ts">
  import { Switch } from '@sveltebuilder/coreui';

  let toggled = $state(false);
</script>

<svelte:head>
  <title>Switch — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Switch</h1>

  <!-- verify: role="switch" on root, aria-checked reflects state -->

  <section class="dev-section">
    <h2>On and off</h2>
    <div class="dev-stage dev-stage--row">
      <Switch label="Off (default)" />
      <Switch label="On" checked={true} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Sizes</h2>
    <div class="dev-stage dev-stage--row">
      <Switch size="sm" label="Small" />
      <Switch size="md" label="Medium" />
    </div>
  </section>

  <section class="dev-section">
    <h2>With inline label</h2>
    <div class="dev-stage">
      <Switch label="Enable email notifications" checked={true} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled</h2>
    <div class="dev-stage dev-stage--row">
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" checked={true} disabled />
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound state (live)</h2>
    <div class="dev-stage">
      <Switch bind:checked={toggled} label="Toggle me" />
      <p style="margin-top: 0.75rem; font-size: 0.875rem;">checked: <strong>{toggled}</strong></p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; }
</style>
