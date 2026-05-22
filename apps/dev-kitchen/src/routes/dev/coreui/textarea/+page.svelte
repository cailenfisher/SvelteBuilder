<script lang="ts">
  import { Textarea, Field } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Textarea — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Textarea</h1>

  <section class="dev-section">
    <h2>Sizes</h2>
    <div class="dev-stage">
      <Textarea size="sm" placeholder="Small textarea" />
      <Textarea size="md" placeholder="Medium textarea" />
      <Textarea size="lg" placeholder="Large textarea" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled</h2>
    <div class="dev-stage">
      <Textarea disabled value="Disabled textarea content" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Read-only</h2>
    <div class="dev-stage">
      <Textarea readonly value="Read-only textarea content" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Error — visual only</h2>
    <div class="dev-stage">
      <Textarea error={true} placeholder="Visual error state" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Error — with message</h2>
    <div class="dev-stage">
      <Textarea error="Bio must be under 500 characters." placeholder="Write your bio…" />
    </div>
  </section>

  <section class="dev-section">
    <h2>With rows prop</h2>
    <div class="dev-stage">
      <Textarea rows={8} placeholder="8 rows of text area" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Inside a Field — automatic ARIA wiring</h2>
    <div class="dev-stage">
      <!--
        Textarea reads id, required, and aria-describedby from Field context.
        verify: aria-describedby="field-bio-hint" on the textarea element
      -->
      <Field label="Bio" id="field-bio" hint="Describe yourself in a few sentences." required>
        <Textarea placeholder="Tell us about yourself…" />
      </Field>
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
