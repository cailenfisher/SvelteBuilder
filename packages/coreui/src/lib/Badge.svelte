<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    variant?: Variant;
    size?: Size;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'default',
    size = 'md',
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['badge', `badge--${variant}`, `badge--${size}`, extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<span class={classes}>
  {@render children()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-weight: var(--badge-font-weight);
    border-radius: var(--badge-radius);
    border: 1px solid transparent;
  }

  /* ------------------------------------------------------------------ */
  /* Sizes                                                                */
  /* ------------------------------------------------------------------ */
  .badge--sm {
    height: var(--badge-height-sm);
    padding: 0 var(--badge-padding-x-sm);
    font-size: var(--badge-font-size-sm);
  }

  .badge--md {
    height: var(--badge-height-md);
    padding: 0 var(--badge-padding-x-md);
    font-size: var(--badge-font-size-md);
  }

  .badge--lg {
    height: var(--badge-height-lg);
    padding: 0 var(--badge-padding-x-lg);
    font-size: var(--badge-font-size-lg);
  }

  /* ------------------------------------------------------------------ */
  /* Variants                                                             */
  /* ------------------------------------------------------------------ */
  .badge--default {
    background-color: var(--color-surface-overlay);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
  }

  .badge--brand {
    background-color: var(--color-brand-subtle);
    color: var(--color-text-brand);
    border-color: var(--color-border-brand);
  }

  .badge--success {
    background-color: var(--color-success-subtle);
    color: var(--color-success-text);
    border-color: var(--color-success-border);
  }

  .badge--warning {
    background-color: var(--color-warning-subtle);
    color: var(--color-warning-text);
    border-color: var(--color-warning-border);
  }

  .badge--danger {
    background-color: var(--color-danger-subtle);
    color: var(--color-danger-text);
    border-color: var(--color-danger-border);
  }

  .badge--info {
    background-color: var(--color-info-subtle);
    color: var(--color-info-text);
    border-color: var(--color-info-border);
  }
</style>
