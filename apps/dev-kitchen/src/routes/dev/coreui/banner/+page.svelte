<script lang="ts">
  import { messageBus } from '@sveltebuilder/coreui';
  import { Banner } from '@sveltebuilder/coreui';

  function sendInfoBanner() {
    messageBus.sendBanner({
      severity: 'info',
      summary: 'Scheduled maintenance on Saturday, June 7, from 02:00–04:00 UTC.',
      detail: 'The system will be read-only during this window.',
    });
  }

  function sendWarningBanner() {
    messageBus.sendBanner({
      severity: 'warning',
      summary: 'Your account storage is 92% full.',
      actions: [{ label: 'Manage storage', onAction: () => alert('Manage storage') }],
    });
  }

  function sendErrorBanner() {
    messageBus.sendBanner({
      severity: 'error',
      summary: 'Unable to connect to the server.',
      detail: 'Working from cached data. Changes will sync when reconnected.',
    });
  }

  function clearBanner() {
    messageBus.dismissBanner();
  }

  // Standalone (prop-driven, no bus) example
  let standaloneVisible = $state(true);
  function resetStandalone() {
    standaloneVisible = true;
  }
</script>

<svelte:head>
  <title>Banner — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Banner</h1>

  <section class="dev-section">
    <h2>Bus-driven (messageBus.sendBanner)</h2>
    <div class="dev-stage">
      <p class="demo-note">
        Banner subscribes to the message bus automatically when no
        <code>message</code> prop is passed. Dismiss it via the × or
        <code>messageBus.dismissBanner()</code>.
      </p>
      <div class="button-row">
        <button type="button" class="demo-btn demo-btn--info" onclick={sendInfoBanner}>
          Info banner
        </button>
        <button type="button" class="demo-btn demo-btn--warning" onclick={sendWarningBanner}>
          Warning banner
        </button>
        <button type="button" class="demo-btn demo-btn--error" onclick={sendErrorBanner}>
          Error banner
        </button>
        <button type="button" class="demo-btn" onclick={clearBanner}>
          Clear banner
        </button>
      </div>
      <p class="demo-note">
        Only one banner appears at a time. A new <code>sendBanner()</code> call replaces
        the current one.
      </p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Standalone (prop-driven, no bus)</h2>
    <div class="dev-stage">
      {#if standaloneVisible}
        <Banner
          message={{
            severity: 'warning',
            summary: 'Your trial ends in 3 days.',
            detail: 'Upgrade to keep full access.',
            actions: [{ label: 'Upgrade now', onAction: () => alert('Upgrade') }],
          }}
          onDismiss={() => (standaloneVisible = false)}
        />
      {:else}
        <p class="demo-note">Banner dismissed.</p>
        <button type="button" class="demo-btn" onclick={resetStandalone}>Show again</button>
      {/if}
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }

  .button-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }

  .demo-btn {
    padding: 0.5rem 0.875rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .demo-btn:hover { background-color: rgba(0,0,0,0.05); }
  .demo-btn--info    { color: #0284c7; }
  .demo-btn--warning { color: #d97706; }
  .demo-btn--error   { color: #dc2626; }

  .demo-note {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }
</style>
