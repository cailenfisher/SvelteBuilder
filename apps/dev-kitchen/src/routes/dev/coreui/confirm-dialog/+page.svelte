<script lang="ts">
  import { Button, ConfirmDialog } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  let open = $state(false);
  let busyOpen = $state(false);
  let outcome = $state('Nothing chosen yet.');

  const confirmCalls: true[] = $state([]);
  const cancelCalls: true[] = $state([]);
  const openCalls: boolean[] = $state([]);
</script>

<Example title="ConfirmDialog">
  <Button variant="danger" onclick={() => (open = true)}>Delete supplier</Button>
  <ConfirmDialog
    bind:open
    title="Delete this supplier?"
    description="Receipts that reference it are kept, but it can no longer be selected."
    confirmLabel="Delete"
    cancelLabel="Keep"
    onConfirm={() => {
      confirmCalls.push(true);
      outcome = 'Confirmed.';
      open = false;
    }}
    onCancel={() => {
      cancelCalls.push(true);
      outcome = 'Cancelled.';
    }}
    onOpenChange={(next) => openCalls.push(next)}
  />
  <p role="status">{outcome}</p>
  <CallbackLog name="onConfirm" calls={confirmCalls} />
  <CallbackLog name="onCancel" calls={cancelCalls} />
  <CallbackLog name="onOpenChange" calls={openCalls} />
</Example>

<Example title="Loading">
  <Button variant="secondary" onclick={() => (busyOpen = true)}>Open a dialog mid-request</Button>
  <ConfirmDialog
    bind:open={busyOpen}
    title="Publishing…"
    confirmLabel="Publish"
    cancelLabel="Cancel"
    loading
    onConfirm={() => (busyOpen = false)}
    onCancel={() => (busyOpen = false)}
  >
    The confirm button stays busy while the request runs.
  </ConfirmDialog>
</Example>
