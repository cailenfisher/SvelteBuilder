<script lang="ts">
  import { Input } from '@sveltebuilder/coreui';

  let boundValue = $state('');
</script>

<svelte:head>
  <title>Input — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Input</h1>

  <section class="dev-section">
    <h2>Sizes</h2>
    <div class="dev-stage">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled</h2>
    <div class="dev-stage">
      <Input disabled placeholder="Disabled input" value="Cannot edit this" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Read-only</h2>
    <div class="dev-stage">
      <Input readonly value="Read-only value" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Input types</h2>
    <div class="dev-stage">
      <Input type="email" placeholder="email@example.com" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="0" />
      <Input type="search" placeholder="Search…" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Error state — visual only</h2>
    <div class="dev-stage">
      <Input error={true} placeholder="Visual error state" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Error state — with message</h2>
    <div class="dev-stage">
      <Input error="This field is required" placeholder="Error with message" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound value (live)</h2>
    <div class="dev-stage">
      <Input bind:value={boundValue} placeholder="Type something…" />
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">Current value: <strong>{boundValue || '(empty)'}</strong></p>
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
