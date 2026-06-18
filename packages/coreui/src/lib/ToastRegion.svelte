<script lang="ts">
  import { messageBus } from './message-bus.svelte.js';
  import Toast from './Toast.svelte';

  const MAX_VISIBLE = 3;

  const visibleToasts = $derived(messageBus.toasts.slice(-MAX_VISIBLE));
  const queueCount = $derived(Math.max(0, messageBus.toasts.length - MAX_VISIBLE));
</script>

<!--
  Fixed-position container. Place once in the root layout.
  Visual channel only — ARIA announcements are handled by MessageAriaLive.
-->
<div class="toast-region" aria-label="Notifications" aria-live="off">
  {#each visibleToasts as message (message.id)}
    <Toast
      {message}
      onDismiss={() => messageBus.dismissToast(message.id)}
    />
  {/each}

  {#if queueCount > 0}
    <p class="queue">+{queueCount} more</p>
  {/if}
</div>