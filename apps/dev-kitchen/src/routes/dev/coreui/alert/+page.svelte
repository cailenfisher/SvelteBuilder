<script lang="ts">
  import { Alert } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Alert — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Alert</h1>

  <section class="dev-section">
    <h2>All variants — with title and body</h2>
    <div class="dev-stage">
      <Alert variant="info" title="Info">
        This is an informational message. It uses <code>role="status"</code> and <code>aria-live="polite"</code>.
      </Alert>
      <Alert variant="success" title="Success">
        Your changes have been saved successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        Your session will expire in 5 minutes. Save your work.
      </Alert>
      <Alert variant="danger" title="Error">
        Something went wrong. Please try again. Uses <code>role="alert"</code> for assertive announcement.
      </Alert>
    </div>
  </section>

  <section class="dev-section">
    <h2>Body only (no title)</h2>
    <div class="dev-stage">
      <Alert variant="info">No title, just body text.</Alert>
      <Alert variant="success">Saved.</Alert>
      <Alert variant="warning">Check your input.</Alert>
      <Alert variant="danger">An error occurred.</Alert>
    </div>
  </section>

  <section class="dev-section">
    <h2>With icon slot</h2>
    <div class="dev-stage">
      <Alert variant="info" title="With icon">
        {#snippet icon()}
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="16" height="16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 10v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        {/snippet}
        The icon is rendered via the icon snippet slot.
      </Alert>
      <Alert variant="danger" title="Error with icon">
        {#snippet icon()}
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="16" height="16">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        {/snippet}
        Something went wrong. The icon provides visual context.
      </Alert>
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
