<script lang="ts">
  import type { SBMessage } from './message-bus.svelte.js';
  import { AUTO_DISMISS_MS } from './message-bus.svelte.js';

  type Props = {
    message: SBMessage;
    onDismiss: () => void;
  };

  let { message, onDismiss }: Props = $props();

  const duration = $derived<number | null>(
    message.undoAction
      ? (message.undoDurationMs ?? 7000)
      : AUTO_DISMISS_MS[message.severity]
  );

  const TICK_MS = 100;
  let elapsed = $state(0);
  let paused = $state(false);
  let detailOpen = $state(false);

  $effect(() => {
    if (duration == null) return;
    const interval = setInterval(() => {
      if (!paused) {
        elapsed += TICK_MS;
        if (elapsed >= duration) {
          clearInterval(interval);
          onDismiss();
        }
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  });

  const progressRemaining = $derived(
    duration != null ? Math.max(0, 1 - elapsed / duration) : 1
  );

  const secondsRemaining = $derived(
    duration != null ? Math.max(0, Math.ceil((duration - elapsed) / 1000)) : 0
  );

  function handleUndo() {
    message.undoAction?.();
    onDismiss();
  }

  const classes = $derived(['toast', message.severity].join(' '));
</script>

<article
  class={classes}
  onmouseenter={() => (paused = true)}
  onmouseleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <span class="icon" aria-hidden="true">
    {#if message.severity === 'success'}
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    {:else if message.severity === 'info'}
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    {:else if message.severity === 'warning'}
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
        <path d="M8 2.5L14 13H2L8 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M8 6.5v3M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    {:else}
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    {/if}
  </span>

  <div class="body">
    <p class="summary">{message.summary}</p>

    {#if message.detail}
      <p class="detail">{message.detail}</p>
    {/if}

    {#if message.technicalId}
      <button
        type="button"
        class="detail-toggle"
        aria-expanded={detailOpen}
        onclick={() => (detailOpen = !detailOpen)}
      >
        {detailOpen ? 'Hide details' : 'Show details'}
      </button>
      {#if detailOpen}
        <p class="ref">Ref: {message.technicalId}</p>
      {/if}
    {/if}

    {#if message.undoAction || (message.actions && message.actions.length > 0)}
      <div class="actions">
        {#if message.undoAction}
          <button type="button" class="action undo" onclick={handleUndo}>Undo</button>
        {/if}
        {#each message.actions ?? [] as action (action.label)}
          <button type="button" class="action" onclick={action.onAction}>{action.label}</button>
        {/each}
      </div>
    {/if}
  </div>

  <button
    type="button"
    class="close"
    aria-label="Dismiss: {message.summary}"
    onclick={onDismiss}
  >
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>

  {#if duration != null}
    <div
      class="timer"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={duration / 1000}
      aria-valuenow={secondsRemaining}
      aria-label="{secondsRemaining} seconds until dismissed"
    >
      <div class="fill" style="width: {progressRemaining * 100}%"></div>
    </div>
  {/if}
</article>