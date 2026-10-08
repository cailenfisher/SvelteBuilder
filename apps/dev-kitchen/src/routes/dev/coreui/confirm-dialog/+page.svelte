<script lang="ts">
  import { Button, ConfirmDialog } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  let open = $state(false);
  let busyOpen = $state(false);
  let outcome = $state('Nothing chosen yet.');
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
      outcome = 'Confirmed.';
      open = false;
    }}
    onCancel={() => (outcome = 'Cancelled.')}
  />
  <p role="status">{outcome}</p>
</Example>

<Example title="Loading">
  <Button variant="secondary" onclick={() => (busyOpen = true)}>Open a dialog mid-request</Button>
  <ConfirmDialog
    bind:open={busyOpen}
    title="Publishing…"
    loading
    onConfirm={() => (busyOpen = false)}
    onCancel={() => (busyOpen = false)}
  >
    The confirm button stays busy while the request runs.
  </ConfirmDialog>
</Example>
