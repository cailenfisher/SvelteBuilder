<script lang="ts">
  import { messageBus } from './message-bus.svelte.js';
  import Toast from './Toast.svelte';

  // Max toasts shown simultaneously. Extras queue behind the visible stack.
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
    <p class="toast-region__queue">+{queueCount} more</p>
  {/if}
</div>

<style>
  .toast-region {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--toast-gap);
    z-index: var(--z-toast);
    pointer-events: none;
  }

  /* Each child toast needs pointer events restored */
  .toast-region :global(.toast) {
    pointer-events: auto;
  }

  .toast-region__queue {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-align: right;
    margin: 0;
    padding-right: var(--space-2);
    pointer-events: none;
  }

  @media (max-width: 480px) {
    .toast-region {
      bottom: var(--space-4);
      right: var(--space-4);
      left: var(--space-4);
    }
  }
</style>
