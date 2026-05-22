<script lang="ts">
  import { Checkbox, Field } from '@sveltebuilder/coreui';

  let checked = $state(false);
  let indeterminate = $state(true);
</script>

<svelte:head>
  <title>Checkbox — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Checkbox</h1>

  <!-- verify: aria-checked on checkbox root, aria-disabled when disabled -->

  <section class="dev-section">
    <h2>States</h2>
    <div class="dev-stage dev-stage--row">
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" checked={true} />
      <Checkbox label="Indeterminate" indeterminate={true} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Sizes</h2>
    <div class="dev-stage dev-stage--row">
      <Checkbox size="sm" label="Small" />
      <Checkbox size="md" label="Medium" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled in each state</h2>
    <div class="dev-stage dev-stage--row">
      <Checkbox label="Disabled unchecked" disabled />
      <Checkbox label="Disabled checked" checked={true} disabled />
      <Checkbox label="Disabled indeterminate" indeterminate={true} disabled />
    </div>
  </section>

  <section class="dev-section">
    <h2>With inline label</h2>
    <div class="dev-stage">
      <Checkbox label="I agree to the terms and conditions" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Inside a Field</h2>
    <div class="dev-stage">
      <Field label="Preferences" id="field-prefs">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <Checkbox label="Email notifications" />
          <Checkbox label="SMS notifications" />
          <Checkbox label="Push notifications" checked={true} />
        </div>
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound state (live)</h2>
    <div class="dev-stage">
      <Checkbox bind:checked label="Toggle me" />
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">checked: <strong>{checked}</strong></p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
</style>
