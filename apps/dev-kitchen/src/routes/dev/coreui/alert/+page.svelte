<script lang="ts">
  import { Alert, Banner, Button, InlineNotification, getMessageBus } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const messageBus = getMessageBus();

  const alertVariants = ['info', 'success', 'warning', 'danger'] as const;
  const severities = ['info', 'success', 'warning', 'error'] as const;

  let dismissed = $state(false);
  let retries = $state(0);
</script>

<Example title="Alert">
  <div style:display="grid" style:gap="var(--space-3)" style:inline-size="100%">
    {#each alertVariants as variant (variant)}
      <Alert {variant} title={`A ${variant} alert`}
        >The body explains what happened and what to do.</Alert
      >
    {/each}
    <Alert variant="info">
      {#snippet icon()}★{/snippet}
      With a custom icon and no title.
    </Alert>
  </div>
</Example>

<Example title="InlineNotification">
  <div style:display="grid" style:gap="var(--space-3)" style:inline-size="100%">
    {#each severities as severity (severity)}
      <InlineNotification {severity} summary={`A ${severity} notification`} />
    {/each}
    <InlineNotification
      severity="error"
      summary="The shipment could not be saved."
      detail="The carrier rejected the address."
      technicalId="ERR-4182"
      actions={[{ label: 'Retry', onAction: () => retries++ }]}
    />
    {#if !dismissed}
      <InlineNotification
        severity="info"
        summary="Dismissible"
        dismissible
        onDismiss={() => (dismissed = true)}
      />
    {/if}
    <p role="status">Retries: {retries}</p>
  </div>
</Example>

<Example title="Banner, given a message">
  <div style:display="grid" style:gap="var(--space-3)" style:inline-size="100%">
    {#each severities as severity (severity)}
      <Banner
        message={{ severity, summary: `A ${severity} banner`, detail: 'Shown from a prop.' }}
      />
    {/each}
  </div>
</Example>

<Example title="Banner, driven by the message bus">
  <div style:display="grid" style:gap="var(--space-3)" style:inline-size="100%">
    <div style:display="flex" style:gap="var(--space-2)">
      <Button
        variant="secondary"
        onclick={() =>
          messageBus.sendBanner({
            severity: 'warning',
            summary: 'Scheduled maintenance at 22:00 UTC.',
          })}>Send banner</Button
      >
      <Button variant="ghost" onclick={() => messageBus.dismissBanner()}>Dismiss banner</Button>
    </div>
    <Banner />
  </div>
</Example>
