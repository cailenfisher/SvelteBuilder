<script lang="ts">
  import { getMessageBus } from '../Message/message-bus.svelte.js';
  import Toast from './Toast.svelte';

  type Props = {
    class?: string | undefined;
  };

  let { class: extraClass }: Props = $props();

  const messageBus = getMessageBus();

  const MAX_VISIBLE = 3;

  const visibleToasts = $derived(messageBus.toasts.slice(-MAX_VISIBLE));
  const queueCount = $derived(Math.max(0, messageBus.toasts.length - MAX_VISIBLE));
</script>

<!--
  Fixed-position container. Place once in the root layout.
  Visual channel only — ARIA announcements are handled by MessageAriaLive.
-->
<div class={['toast-region', extraClass ?? ''].filter(Boolean).join(' ')} role="region" aria-label={messageBus.labels.region} aria-live="off">
  {#each visibleToasts as message (message.id)}
    <Toast
      {message}
      onDismiss={() => messageBus.dismissToast(message.id)}
    />
  {/each}

  {#if queueCount > 0}
    <p class="queue">{messageBus.labels.queued(queueCount)}</p>
  {/if}
</div>