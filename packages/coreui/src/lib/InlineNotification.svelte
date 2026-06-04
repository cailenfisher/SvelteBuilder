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
    ['notification', severity, extraClass ?? ''].filter(Boolean).join(' ')
  );

  const role = $derived(severity === 'error' || severity === 'warning' ? 'alert' : 'status');
  const ariaLive = $derived(role === 'status' ? 'polite' : undefined);
</script>

{#if visible}
  <div class={classes} role={role} aria-live={ariaLive}>
    <span class="icon" aria-hidden="true">
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

    <div class="body">
      <p class="summary">{summary}</p>

      {#if detail}
        <p class="detail">{detail}</p>
      {/if}

      {#if technicalId}
        <button
          type="button"
          class="detail-toggle"
          aria-expanded={detailOpen}
          onclick={() => (detailOpen = !detailOpen)}
        >
          {detailOpen ? 'Hide details' : 'Show details'}
        </button>
        {#if detailOpen}
          <p class="ref">Ref: {technicalId}</p>
        {/if}
      {/if}

      {#if actions && actions.length > 0}
        <div class="actions">
          {#each actions as action (action.label)}
            <button type="button" class="action" onclick={action.onAction}>
              {action.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if dismissible}
      <button
        type="button"
        class="close"
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