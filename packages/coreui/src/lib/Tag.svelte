<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

  type Props = {
    variant?: Variant;
    onremove?: () => void;
    removeLabel?: string;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'default',
    onremove,
    removeLabel = 'Remove',
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['tag', `tag--${variant}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span class={classes}>
  <span class="tag__label">
    {@render children()}
  </span>
  {#if onremove}
    <button
      type="button"
      class="tag__remove"
      aria-label={removeLabel}
      onclick={onremove}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
        width="10"
        height="10"
      >
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
        />
      </svg>
    </button>
  {/if}
</span>

<style>
  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: var(--badge-height-md);
    padding: 0 var(--badge-padding-x-md);
    font-size: var(--badge-font-size-md);
    font-weight: var(--badge-font-weight);
    border-radius: var(--badge-radius);
    border: 1px solid transparent;
    white-space: nowrap;
  }

  /* ------------------------------------------------------------------ */
  /* Variants (same palette as Badge)                                     */
  /* ------------------------------------------------------------------ */
  .tag--default {
    background-color: var(--color-surface-overlay);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
  }

  .tag--brand {
    background-color: var(--color-brand-subtle);
    color: var(--color-text-brand);
    border-color: var(--color-border-brand);
  }

  .tag--success {
    background-color: var(--color-success-subtle);
    color: var(--color-success-text);
    border-color: var(--color-success-border);
  }

  .tag--warning {
    background-color: var(--color-warning-subtle);
    color: var(--color-warning-text);
    border-color: var(--color-warning-border);
  }

  .tag--danger {
    background-color: var(--color-danger-subtle);
    color: var(--color-danger-text);
    border-color: var(--color-danger-border);
  }

  .tag--info {
    background-color: var(--color-info-subtle);
    color: var(--color-info-text);
    border-color: var(--color-info-border);
  }

  /* ------------------------------------------------------------------ */
  /* Remove button                                                        */
  /* ------------------------------------------------------------------ */
  .tag__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: var(--radius-full);
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    line-height: 1;
    flex-shrink: 0;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .tag__remove:hover {
    opacity: 1;
  }

  .tag__remove:focus-visible {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: 1px;
  }
</style>
