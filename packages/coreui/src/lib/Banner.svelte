<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { SBMessageAction } from './message-bus.svelte.js';
  import { messageBus } from './message-bus.svelte.js';

  type Severity = 'success' | 'info' | 'warning' | 'error';

  type Props = {
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

  const busBanner = $derived(messageProp === undefined ? messageBus.banner : null);
  const active = $derived(messageProp !== undefined ? messageProp : busBanner);

  function handleDismiss() {
    if (messageProp === undefined) messageBus.dismissBanner();
    onDismiss?.();
  }

  const classes = $derived(
    ['banner', active ? active.severity : '', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

{#if active}
  <div class={classes} role="alert" aria-live="assertive" aria-atomic="true">
    <span class="icon" aria-hidden="true">
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

    <div class="body">
      <span class="summary">{active.summary}</span>
      {#if active.detail}
        <span class="detail">{active.detail}</span>
      {/if}
      {#if active.actions && active.actions.length > 0}
        <span class="actions">
          {#each active.actions as action (action.label)}
            <button type="button" class="action" onclick={action.onAction}>{action.label}</button>
          {/each}
        </span>
      {/if}
    </div>

    <button
      type="button"
      class="close"
      aria-label="Dismiss: {active.summary}"
      onclick={handleDismiss}
    >
      <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
{/if}