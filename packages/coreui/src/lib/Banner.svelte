<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { SBMessageAction } from './message-bus.svelte.js';
  import { messageBus } from './message-bus.svelte.js';

  type Severity = 'success' | 'info' | 'warning' | 'error';

  type Props = {
    /**
     * When message is omitted, Banner subscribes to messageBus.banner
     * automatically. Pass message explicitly to use Banner as a standalone
     * controlled component (e.g., a persistent session warning).
     */
    message?: {
      severity: Severity;
      summary: string;
      detail?: string;
      actions?: SBMessageAction[];
    } | null;
    onDismiss?: () => void;
    class?: string | undefined;
    icon?: Snippet;
  };

  let {
    message: messageProp,
    onDismiss,
    class: extraClass,
    icon,
  }: Props = $props();

  // When no explicit message prop, pull from the bus (undefined prop = bus-driven mode).
  const busBanner = $derived(messageProp === undefined ? messageBus.banner : null);
  const active = $derived(messageProp !== undefined ? messageProp : busBanner);

  function handleDismiss() {
    if (messageProp === undefined) {
      messageBus.dismissBanner();
    }
    onDismiss?.();
  }

  const classes = $derived(
    ['banner', active ? `banner--${active.severity}` : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

{#if active}
  <div class={classes} role="alert" aria-live="assertive" aria-atomic="true">
    <span class="banner__icon" aria-hidden="true">
      {#if icon}
        {@render icon()}
      {:else if active.severity === 'success'}
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {:else if active.severity === 'info'}
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      {:else if active.severity === 'warning'}
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

    <div class="banner__body">
      <span class="banner__summary">{active.summary}</span>

      {#if active.detail}
        <span class="banner__detail">{active.detail}</span>
      {/if}

      {#if active.actions && active.actions.length > 0}
        <span class="banner__actions">
          {#each active.actions as action (action.label)}
            <button type="button" class="banner__action" onclick={action.onAction}>
              {action.label}
            </button>
          {/each}
        </span>
      {/if}
    </div>

    <button
      type="button"
      class="banner__close"
      aria-label="Dismiss: {active.summary}"
      onclick={handleDismiss}
    >
      <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
{/if}

<style>
  /* ------------------------------------------------------------------ */
  /* Base                                                                  */
  /* ------------------------------------------------------------------ */
  .banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--banner-padding-y) var(--banner-padding-x);
    border-bottom: var(--banner-border-width) solid transparent;
    animation: banner-in var(--duration-normal) var(--ease-out);
  }

  @keyframes banner-in {
    from { opacity: 0; transform: translateY(-0.5rem); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ------------------------------------------------------------------ */
  /* Variants                                                              */
  /* ------------------------------------------------------------------ */
  .banner--success {
    background-color: var(--color-success-subtle);
    border-color: var(--color-success-border);
    color: var(--color-success-text);
  }

  .banner--info {
    background-color: var(--color-info-subtle);
    border-color: var(--color-info-border);
    color: var(--color-info-text);
  }

  .banner--warning {
    background-color: var(--color-warning-subtle);
    border-color: var(--color-warning-border);
    color: var(--color-warning-text);
  }

  .banner--error {
    background-color: var(--color-danger-subtle);
    border-color: var(--color-danger-border);
    color: var(--color-danger-text);
  }

  /* ------------------------------------------------------------------ */
  /* Icon                                                                  */
  /* ------------------------------------------------------------------ */
  .banner__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
  }

  /* ------------------------------------------------------------------ */
  /* Body                                                                  */
  /* ------------------------------------------------------------------ */
  .banner__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1-5) var(--space-3);
  }

  .banner__summary {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
  }

  .banner__detail {
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    opacity: 0.85;
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                               */
  /* ------------------------------------------------------------------ */
  .banner__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .banner__action {
    background: none;
    border: 1px solid currentColor;
    border-radius: var(--radius-md);
    padding: var(--space-0-5) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    font-family: var(--font-sans);
    color: inherit;
    cursor: pointer;
    opacity: 0.8;
    white-space: nowrap;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .banner__action:hover {
    opacity: 1;
  }

  /* ------------------------------------------------------------------ */
  /* Close button                                                          */
  /* ------------------------------------------------------------------ */
  .banner__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    margin-left: auto;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    color: inherit;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .banner__close:hover {
    opacity: 1;
  }

  .banner__close:focus-visible {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
</style>
