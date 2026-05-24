<script lang="ts">
  import { messageBus } from '@sveltebuilder/coreui';

  let lastId = $state('');

  function sendSuccess() {
    messageBus.sendToast({
      severity: 'success',
      summary: 'Changes saved successfully.',
    });
  }

  function sendInfo() {
    messageBus.sendToast({
      severity: 'info',
      summary: 'Processing your request.',
      detail: 'This may take a few seconds.',
    });
  }

  function sendWarning() {
    messageBus.sendToast({
      severity: 'warning',
      summary: 'Session expires in 5 minutes.',
      detail: 'Save your work to avoid losing changes.',
    });
  }

  function sendError() {
    messageBus.sendToast({
      severity: 'error',
      summary: 'The shipment could not be saved.',
      detail: 'Check that the destination address is complete and try again.',
      technicalId: 'ERR-7f2a3c',
      actions: [
        { label: 'Retry', onAction: () => alert('Retry clicked') },
      ],
    });
  }

  function sendUndo() {
    const orderId = '#4821';
    messageBus.sendToast({
      severity: 'success',
      summary: `Order ${orderId} deleted.`,
      undoAction: () => {
        messageBus.sendToast({
          severity: 'success',
          summary: `Order ${orderId} restored.`,
        });
      },
    });
  }

  function sendQueue() {
    ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].forEach((name, i) => {
      setTimeout(() => {
        messageBus.sendToast({
          severity: 'info',
          summary: `Task ${name} completed.`,
        });
      }, i * 200);
    });
  }

  function sendWithAction() {
    messageBus.sendToast({
      severity: 'warning',
      summary: 'Your subscription will expire tomorrow.',
      actions: [
        { label: 'Renew now', onAction: () => alert('Renew clicked') },
        { label: 'Remind later', onAction: () => {} },
      ],
    });
  }
</script>

<svelte:head>
  <title>Toast — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Toast / Snackbar</h1>

  <section class="dev-section">
    <h2>Severity variants</h2>
    <div class="dev-stage">
      <div class="button-row">
        <button type="button" class="demo-btn demo-btn--success" onclick={sendSuccess}>
          Success toast
        </button>
        <button type="button" class="demo-btn demo-btn--info" onclick={sendInfo}>
          Info toast
        </button>
        <button type="button" class="demo-btn demo-btn--warning" onclick={sendWarning}>
          Warning toast
        </button>
        <button type="button" class="demo-btn demo-btn--error" onclick={sendError}>
          Error toast (with technicalId + action)
        </button>
      </div>
      <p class="demo-note">
        Success and info auto-dismiss (5 s / 7 s). Warning and error persist until dismissed.
        Error is the only severity that should reach a toast in the undo-toast pattern; for form
        errors use <code>InlineNotification</code>.
      </p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Undo pattern</h2>
    <div class="dev-stage">
      <button type="button" class="demo-btn demo-btn--danger" onclick={sendUndo}>
        Delete Order #4821 (with Undo)
      </button>
      <p class="demo-note">
        Action executes immediately; a 7-second countdown appears. Clicking Undo reverses
        the action and confirms with a second toast. No confirmation dialog needed.
      </p>
    </div>
  </section>

  <section class="dev-section">
    <h2>With actions</h2>
    <div class="dev-stage">
      <button type="button" class="demo-btn" onclick={sendWithAction}>
        Toast with multiple actions
      </button>
    </div>
  </section>

  <section class="dev-section">
    <h2>Queue (max 3 visible)</h2>
    <div class="dev-stage">
      <button type="button" class="demo-btn" onclick={sendQueue}>
        Send 5 toasts rapidly
      </button>
      <p class="demo-note">
        Only the last 3 are shown simultaneously. The "+N more" indicator appears when
        toasts are queued.
      </p>
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
  .demo-btn--success { color: #16a34a; }
  .demo-btn--info    { color: #0284c7; }
  .demo-btn--warning { color: #d97706; }
  .demo-btn--error   { color: #dc2626; }
  .demo-btn--danger  { color: #dc2626; }

  .demo-note {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }
</style>
