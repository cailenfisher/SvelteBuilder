<!-- ToastRegion and MessageAriaLive are mounted once by the base chrome's root layout, so
     this page exercises them by sending through the bus rather than mounting copies. -->
<script lang="ts">
  import { Button, Toast, getMessageBus, type SBMessageSeverity } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const messageBus = getMessageBus();
  const severities: SBMessageSeverity[] = ['info', 'success', 'warning', 'error'];

  let undone = $state(0);
  let staticDismissed = $state(false);
</script>

<Example title="Toast, rendered directly">
  {#if !staticDismissed}
    <Toast
      message={{ id: 'static', severity: 'success', summary: 'Supplier saved', detail: 'Acme Freight is now active.' }}
      onDismiss={() => (staticDismissed = true)}
    />
  {:else}
    <Button variant="ghost" onclick={() => (staticDismissed = false)}>Show again</Button>
  {/if}
</Example>

<Example title="Through the bus (ToastRegion, MessageAriaLive)">
  {#each severities as severity (severity)}
    <Button variant="secondary" onclick={() => messageBus.sendToast({ severity, summary: `A ${severity} toast` })}
      >{severity}</Button
    >
  {/each}
  <Button
    variant="secondary"
    onclick={() =>
      messageBus.sendToast({
        severity: 'error',
        summary: 'Pick task could not be completed',
        detail: 'Location A-04-2 reports less stock than requested.',
        technicalId: 'PICK-0091',
      })}>Error with detail</Button
  >
  <Button
    variant="secondary"
    onclick={() =>
      messageBus.sendToast({
        severity: 'info',
        summary: 'Shipment archived',
        undoAction: () => undone++,
        undoDurationMs: 8000,
      })}>With undo</Button
  >
  <p role="status">Undone {undone} {undone === 1 ? 'time' : 'times'}.</p>
</Example>
