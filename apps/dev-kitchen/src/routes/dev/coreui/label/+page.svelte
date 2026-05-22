<script lang="ts">
  import { Label } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Label — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Label</h1>

  <section class="dev-section">
    <h2>Standalone label with for= pointing at a plain input</h2>
    <div class="dev-stage">
      <Label for="plain-input">Email address</Label>
      <input id="plain-input" type="email" placeholder="you@example.com" style="display: block; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem; width: 100%;" />
    </div>
  </section>

  <section class="dev-section">
    <h2>With required indicator</h2>
    <div class="dev-stage">
      <Label for="required-input" required>Password</Label>
      <input id="required-input" type="password" placeholder="••••••••" style="display: block; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem; width: 100%;" />
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
