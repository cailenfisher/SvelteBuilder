<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'info' | 'success' | 'warning' | 'danger';

  type Props = {
    variant?: Variant;
    title?: string;
    children: Snippet;
    icon?: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'info',
    title,
    children,
    icon,
    class: extraClass,
  }: Props = $props();

  // danger and warning are urgent/assertive; info and success are polite
  const role = $derived(
    variant === 'danger' || variant === 'warning' ? 'alert' : 'status'
  );

  const classes = $derived(
    ['alert', `alert--${variant}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={classes} role={role} aria-live={role === 'status' ? 'polite' : undefined}>
  {#if icon}
    <span class="alert__icon" aria-hidden="true">
      {@render icon()}
    </span>
  {/if}

  <div class="alert__body">
    {#if title}
      <p class="alert__title">{title}</p>
    {/if}
    <div class="alert__content">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--alert-padding-y) var(--alert-padding-x);
    border-radius: var(--alert-radius);
    border: var(--alert-border-width) solid transparent;
  }

  /* ------------------------------------------------------------------ */
  /* Variants                                                             */
  /* ------------------------------------------------------------------ */
  .alert--info {
    background-color: var(--color-info-subtle);
    border-color: var(--color-info-border);
    color: var(--color-info-text);
  }

  .alert--success {
    background-color: var(--color-success-subtle);
    border-color: var(--color-success-border);
    color: var(--color-success-text);
  }

  .alert--warning {
    background-color: var(--color-warning-subtle);
    border-color: var(--color-warning-border);
    color: var(--color-warning-text);
  }

  .alert--danger {
    background-color: var(--color-danger-subtle);
    border-color: var(--color-danger-border);
    color: var(--color-danger-text);
  }

  /* ------------------------------------------------------------------ */
  /* Icon                                                                 */
  /* ------------------------------------------------------------------ */
  .alert__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: var(--space-0-5);
  }

  /* ------------------------------------------------------------------ */
  /* Body                                                                 */
  /* ------------------------------------------------------------------ */
  .alert__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .alert__title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    margin: 0;
    line-height: var(--leading-snug);
  }

  .alert__content {
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }
</style>
