<script lang="ts">
  import { Field, Input } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Field — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Field</h1>

  <section class="dev-section">
    <h2>Label only</h2>
    <div class="dev-stage">
      <Field label="Username" id="field-username">
        <Input placeholder="Enter username" />
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Label + hint</h2>
    <div class="dev-stage">
      <Field label="Email" id="field-email" hint="We will never share your email.">
        <Input type="email" placeholder="you@example.com" />
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Label + error</h2>
    <div class="dev-stage">
      <Field label="Password" id="field-password" error="Password must be at least 8 characters.">
        <Input type="password" placeholder="Password" />
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Error overrides hint (both present)</h2>
    <div class="dev-stage">
      <Field
        label="Username"
        id="field-username-both"
        hint="Letters and numbers only."
        error="Username is already taken."
      >
        <Input placeholder="Try a different username" />
      </Field>
      <!-- When both hint and error are set, Field shows error and hides hint -->
    </div>
  </section>

  <section class="dev-section">
    <h2>Required indicator</h2>
    <div class="dev-stage">
      <Field label="Full name" id="field-fullname" required>
        <Input placeholder="Jane Smith" />
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Disabled — label and hint adopt disabled color</h2>
    <div class="dev-stage">
      <Field label="Account ID" id="field-account" hint="Assigned at registration." disabled>
        <Input placeholder="Disabled" />
      </Field>
    </div>
  </section>

  <section class="dev-section">
    <h2>Full composition — automatic ARIA wiring</h2>
    <div class="dev-stage">
      <!--
        The Input below has NO id, required, or aria-describedby set directly.
        Field injects them all via Svelte context (useField()).
        Inspect the DOM: the <input> will have id="field-wired", required,
        and aria-describedby pointing at the hint/error spans.
        verify: id="field-wired", aria-describedby="field-wired-hint"
      -->
      <Field label="Display name" id="field-wired" hint="Shown publicly on your profile." required>
        <Input placeholder="Your name" />
      </Field>
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
