<script lang="ts">
  import { InlineNotification } from '@sveltebuilder/coreui';

  let formError = $state<string | null>(null);
  let formSubmitting = $state(false);

  function simulateFormError() {
    formSubmitting = true;
    setTimeout(() => {
      formSubmitting = false;
      formError = 'The destination address is incomplete.';
    }, 800);
  }

  function clearFormError() {
    formError = null;
  }
</script>

<svelte:head>
  <title>InlineNotification — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>InlineNotification</h1>

  <p class="page-description">
    Persistent, contextual notifications rendered inside component boundaries.
    The correct surface for form errors and entity-level data problems — never use
    a toast for these.
  </p>

  <section class="dev-section">
    <h2>All severities</h2>
    <div class="dev-stage">
      <InlineNotification severity="success" summary="Your profile has been updated." />
      <InlineNotification
        severity="info"
        summary="This item is currently under review."
        detail="Changes will take effect once the review is complete."
      />
      <InlineNotification
        severity="warning"
        summary="Your session will expire in 5 minutes."
        detail="Save your work to avoid losing changes."
      />
      <InlineNotification
        severity="error"
        summary="The shipment could not be saved."
        detail="Check that the destination address is complete and try again."
        technicalId="ERR-7f2a3c"
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>Dismissible</h2>
    <div class="dev-stage">
      <InlineNotification
        severity="info"
        summary="A new version of SvelteBuilder is available."
        detail="Update to get the latest components and improvements."
        dismissible
        actions={[{ label: 'View changelog', onAction: () => alert('View changelog') }]}
      />
      <InlineNotification
        severity="warning"
        summary="Your export quota resets on June 1."
        dismissible
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>With actions</h2>
    <div class="dev-stage">
      <InlineNotification
        severity="error"
        summary="Payment method declined."
        detail="The charge to your card ending in 4242 was refused."
        actions={[
          { label: 'Update payment', onAction: () => alert('Update payment') },
          { label: 'Contact support', onAction: () => alert('Contact support') },
        ]}
      />
    </div>
  </section>

  <section class="dev-section">
    <h2>In-form usage — simulated server error</h2>
    <div class="dev-stage">
      <form class="demo-form" onsubmit={(e) => { e.preventDefault(); simulateFormError(); }}>
        <label for="destination">Destination address</label>
        <input id="destination" type="text" placeholder="123 Main St" />

        {#if formError}
          <InlineNotification
            severity="error"
            summary={formError}
            detail="Complete the address and submit again."
            dismissible
            onDismiss={clearFormError}
            actions={[{ label: 'Get help', onAction: () => alert('Help') }]}
          />
        {/if}

        <div class="demo-form__actions">
          <button type="submit" disabled={formSubmitting} class="demo-submit">
            {formSubmitting ? 'Saving…' : 'Save shipment'}
          </button>
          {#if formError}
            <button type="button" class="demo-clear" onclick={clearFormError}>Clear error</button>
          {/if}
        </div>
      </form>
      <p class="demo-note">
        Click "Save shipment" to trigger a simulated server error shown inline,
        adjacent to the form. The error persists until dismissed or corrected.
      </p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 0.5rem; }
  .page-description { font-size: 0.875rem; color: #6b7280; margin-block-end: 2rem; line-height: 1.5; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }

  .demo-form {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .demo-form label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .demo-form input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .demo-form__actions {
    display: flex;
    gap: 0.5rem;
  }

  .demo-submit {
    padding: 0.5rem 1rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .demo-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-clear {
    padding: 0.5rem 0.75rem;
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .demo-note {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }
</style>
