<script lang="ts">
  import type { SBMessage } from './message-bus.svelte.js';
  import { AUTO_DISMISS_MS } from './message-bus.svelte.js';

  type Props = {
    message: SBMessage;
    onDismiss: () => void;
  };

  let { message, onDismiss }: Props = $props();

  // If undoAction is present, override duration with undoDurationMs or 7 s.
  // Otherwise use the severity default (null means no auto-dismiss).
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
      // Reads paused from outer scope each tick; not tracked as $effect dependency.
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

  const classes = $derived(['toast', `toast--${message.severity}`].join(' '));
</script>

<article
  class={classes}
  onmouseenter={() => (paused = true)}
  onmouseleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <span class="toast__icon" aria-hidden="true">
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

  <div class="toast__body">
    <p class="toast__summary">{message.summary}</p>

    {#if message.detail}
      <p class="toast__detail">{message.detail}</p>
    {/if}

    {#if message.technicalId}
      <button
        type="button"
        class="toast__detail-toggle"
        aria-expanded={detailOpen}
        onclick={() => (detailOpen = !detailOpen)}
      >
        {detailOpen ? 'Hide details' : 'Show details'}
      </button>
      {#if detailOpen}
        <p class="toast__technical-id">Ref: {message.technicalId}</p>
      {/if}
    {/if}

    {#if message.undoAction || (message.actions && message.actions.length > 0)}
      <div class="toast__actions">
        {#if message.undoAction}
          <button type="button" class="toast__action toast__action--undo" onclick={handleUndo}>
            Undo
          </button>
        {/if}
        {#each message.actions ?? [] as action (action.label)}
          <button type="button" class="toast__action" onclick={action.onAction}>
            {action.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <button
    type="button"
    class="toast__close"
    aria-label="Dismiss: {message.summary}"
    onclick={onDismiss}
  >
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>

  {#if duration != null}
    <div
      class="toast__timer"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={duration / 1000}
      aria-valuenow={secondsRemaining}
      aria-label="{secondsRemaining} seconds until dismissed"
    >
      <div class="toast__timer-fill" style="width: {progressRemaining * 100}%"></div>
    </div>
  {/if}
</article>

<style>
  /* ------------------------------------------------------------------ */
  /* Base                                                                  */
  /* ------------------------------------------------------------------ */
  .toast {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    width: var(--toast-max-width);
    max-width: calc(100vw - var(--space-8));
    padding: var(--toast-padding);
    background-color: var(--toast-bg);
    border: 1px solid var(--toast-border);
    border-radius: var(--toast-radius);
    box-shadow: var(--toast-shadow);
    overflow: hidden;
    animation: toast-in var(--duration-normal) var(--ease-spring);
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateX(1rem); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ------------------------------------------------------------------ */
  /* Severity accent — left border strip                                  */
  /* ------------------------------------------------------------------ */
  .toast::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: var(--toast-radius) 0 0 var(--toast-radius);
  }

  .toast--success::before { background-color: var(--color-success); }
  .toast--info::before    { background-color: var(--color-info); }
  .toast--warning::before { background-color: var(--color-warning); }
  .toast--error::before   { background-color: var(--color-danger); }
  .toast--critical::before { background-color: var(--color-danger); }

  /* ------------------------------------------------------------------ */
  /* Icon                                                                  */
  /* ------------------------------------------------------------------ */
  .toast__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    margin-top: 1px;
  }

  .toast--success .toast__icon { color: var(--color-success-text); }
  .toast--info    .toast__icon { color: var(--color-info-text); }
  .toast--warning .toast__icon { color: var(--color-warning-text); }
  .toast--error   .toast__icon { color: var(--color-danger-text); }
  .toast--critical .toast__icon { color: var(--color-danger-text); }

  /* ------------------------------------------------------------------ */
  /* Body                                                                  */
  /* ------------------------------------------------------------------ */
  .toast__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .toast__summary {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
    line-height: var(--leading-snug);
    margin: 0;
  }

  .toast__detail {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-normal);
    margin: 0;
  }

  /* ------------------------------------------------------------------ */
  /* Technical detail disclosure                                           */
  /* ------------------------------------------------------------------ */
  .toast__detail-toggle {
    display: inline;
    background: none;
    border: none;
    padding: 0;
    font-size: var(--text-xs);
    color: var(--color-text-link);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-family: var(--font-sans);
    text-align: left;
  }

  .toast__detail-toggle:hover {
    color: var(--color-text-link-hover);
  }

  .toast__technical-id {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    margin: 0;
    word-break: break-all;
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                               */
  /* ------------------------------------------------------------------ */
  .toast__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .toast__action {
    background: none;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  .toast__action:hover {
    background-color: var(--color-surface-raised);
  }

  .toast__action--undo {
    font-weight: var(--weight-semibold);
    color: var(--color-text-brand);
    border-color: var(--color-border-brand);
  }

  .toast__action--undo:hover {
    background-color: var(--color-brand-subtle);
  }

  /* ------------------------------------------------------------------ */
  /* Close button                                                          */
  /* ------------------------------------------------------------------ */
  .toast__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
  }

  .toast__close:hover {
    background-color: var(--color-surface-raised);
    color: var(--color-text-primary);
  }

  .toast__close:focus-visible {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* ------------------------------------------------------------------ */
  /* Countdown timer bar                                                   */
  /* ------------------------------------------------------------------ */
  .toast__timer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--toast-timer-height);
    background-color: var(--color-border-subtle);
    overflow: hidden;
    border-radius: 0 0 var(--toast-radius) var(--toast-radius);
  }

  .toast__timer-fill {
    height: 100%;
    transition: width var(--duration-fast) linear;
  }

  .toast--success .toast__timer-fill { background-color: var(--color-success); }
  .toast--info    .toast__timer-fill { background-color: var(--color-info); }
  .toast--warning .toast__timer-fill { background-color: var(--color-warning); }
  .toast--error   .toast__timer-fill { background-color: var(--color-danger); }
  .toast--critical .toast__timer-fill { background-color: var(--color-danger); }
</style>
