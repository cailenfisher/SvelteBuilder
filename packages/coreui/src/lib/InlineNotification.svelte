<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { SBMessageAction } from './message-bus.svelte.js';

  type Severity = 'success' | 'info' | 'warning' | 'error';

  type Props = {
    severity?: Severity;
    summary: string;
    detail?: string;
    technicalId?: string;
    actions?: SBMessageAction[];
    dismissible?: boolean;
    onDismiss?: () => void;
    class?: string | undefined;
    icon?: Snippet;
  };

  let {
    severity = 'info',
    summary,
    detail,
    technicalId,
    actions,
    dismissible = false,
    onDismiss,
    class: extraClass,
    icon,
  }: Props = $props();

  let detailOpen = $state(false);
  let visible = $state(true);

  function handleDismiss() {
    visible = false;
    onDismiss?.();
  }

  const classes = $derived(
    [
      'inline-notification',
      `inline-notification--${severity}`,
      extraClass ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  );

  // danger/warning are assertive; success/info are polite
  const role = $derived(severity === 'error' || severity === 'warning' ? 'alert' : 'status');
  const ariaLive = $derived(role === 'status' ? 'polite' : undefined);
</script>

{#if visible}
  <div class={classes} role={role} aria-live={ariaLive}>
    <span class="inline-notification__icon" aria-hidden="true">
      {#if icon}
        {@render icon()}
      {:else if severity === 'success'}
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {:else if severity === 'info'}
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 7v4M8 5.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      {:else if severity === 'warning'}
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

    <div class="inline-notification__body">
      <p class="inline-notification__summary">{summary}</p>

      {#if detail}
        <p class="inline-notification__detail">{detail}</p>
      {/if}

      {#if technicalId}
        <button
          type="button"
          class="inline-notification__detail-toggle"
          aria-expanded={detailOpen}
          onclick={() => (detailOpen = !detailOpen)}
        >
          {detailOpen ? 'Hide details' : 'Show details'}
        </button>
        {#if detailOpen}
          <p class="inline-notification__technical-id">Ref: {technicalId}</p>
        {/if}
      {/if}

      {#if actions && actions.length > 0}
        <div class="inline-notification__actions">
          {#each actions as action (action.label)}
            <button type="button" class="inline-notification__action" onclick={action.onAction}>
              {action.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if dismissible}
      <button
        type="button"
        class="inline-notification__close"
        aria-label="Dismiss: {summary}"
        onclick={handleDismiss}
      >
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  /* ------------------------------------------------------------------ */
  /* Base                                                                  */
  /* ------------------------------------------------------------------ */
  .inline-notification {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--inline-notification-padding-y) var(--inline-notification-padding-x);
    border-radius: var(--inline-notification-radius);
    border: var(--inline-notification-border-width) solid transparent;
  }

  /* ------------------------------------------------------------------ */
  /* Variants                                                              */
  /* ------------------------------------------------------------------ */
  .inline-notification--success {
    background-color: var(--color-success-subtle);
    border-color: var(--color-success-border);
    color: var(--color-success-text);
  }

  .inline-notification--info {
    background-color: var(--color-info-subtle);
    border-color: var(--color-info-border);
    color: var(--color-info-text);
  }

  .inline-notification--warning {
    background-color: var(--color-warning-subtle);
    border-color: var(--color-warning-border);
    color: var(--color-warning-text);
  }

  .inline-notification--error {
    background-color: var(--color-danger-subtle);
    border-color: var(--color-danger-border);
    color: var(--color-danger-text);
  }

  /* ------------------------------------------------------------------ */
  /* Icon                                                                  */
  /* ------------------------------------------------------------------ */
  .inline-notification__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    margin-top: 1px;
  }

  /* ------------------------------------------------------------------ */
  /* Body                                                                  */
  /* ------------------------------------------------------------------ */
  .inline-notification__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .inline-notification__summary {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    margin: 0;
  }

  .inline-notification__detail {
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    margin: 0;
    opacity: 0.85;
  }

  .inline-notification__detail-toggle {
    display: inline;
    background: none;
    border: none;
    padding: 0;
    font-size: var(--text-xs);
    color: inherit;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-family: var(--font-sans);
    opacity: 0.75;
    text-align: left;
  }

  .inline-notification__detail-toggle:hover {
    opacity: 1;
  }

  .inline-notification__technical-id {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    margin: 0;
    opacity: 0.65;
    word-break: break-all;
  }

  /* ------------------------------------------------------------------ */
  /* Actions                                                               */
  /* ------------------------------------------------------------------ */
  .inline-notification__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .inline-notification__action {
    background: none;
    border: 1px solid currentColor;
    border-radius: var(--radius-md);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    font-family: var(--font-sans);
    color: inherit;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .inline-notification__action:hover {
    opacity: 1;
  }

  /* ------------------------------------------------------------------ */
  /* Close button                                                          */
  /* ------------------------------------------------------------------ */
  .inline-notification__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    color: inherit;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .inline-notification__close:hover {
    opacity: 1;
  }

  .inline-notification__close:focus-visible {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
</style>
