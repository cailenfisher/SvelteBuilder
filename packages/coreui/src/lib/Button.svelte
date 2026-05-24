<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  type Size = 'sm' | 'md' | 'lg';

  type BaseProps = {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    full?: boolean;
    children: Snippet;
    leading?: Snippet;
    trailing?: Snippet;
  };

  // Discriminated union: either a button or an anchor, never both
  type ButtonProps = BaseProps & HTMLButtonAttributes & { href?: never };
  type AnchorProps = BaseProps & HTMLAnchorAttributes & { href: string };

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    full = false,
    href,
    children,
    leading,
    trailing,
    disabled,
    class: extraClass,
    ...restProps
  }: ButtonProps | AnchorProps = $props();

  const isDisabled = $derived(disabled || loading);

  const classes = $derived(
    [
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      full ? 'btn--full' : '',
      loading ? 'btn--loading' : '',
      extraClass ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

<!--
  Renders a <button> by default.
  When href is provided, renders a semantically correct <a> element.
  Never renders an <a> without href or a <button> with href.
-->
{#if href}
  <a
    {href}
    class={classes}
    aria-disabled={isDisabled || undefined}
    tabindex={isDisabled ? -1 : undefined}
    {...restProps as HTMLAnchorAttributes}
  >
    {#if loading}
      <span class="btn__spinner" aria-hidden="true"></span>
    {:else if leading}
      <span class="btn__leading" aria-hidden="true">
        {@render leading()}
      </span>
    {/if}

    <span class="btn__label">
      {@render children()}
    </span>

    {#if !loading && trailing}
      <span class="btn__trailing" aria-hidden="true">
        {@render trailing()}
      </span>
    {/if}
  </a>
{:else}
  <button
    type="button"
    class={classes}
    disabled={isDisabled || undefined}
    aria-busy={loading || undefined}
    {...restProps as HTMLButtonAttributes}
  >
    {#if loading}
      <span class="btn__spinner" aria-hidden="true"></span>
    {:else if leading}
      <span class="btn__leading" aria-hidden="true">
        {@render leading()}
      </span>
    {/if}

    <span class="btn__label">
      {@render children()}
    </span>

    {#if !loading && trailing}
      <span class="btn__trailing" aria-hidden="true">
        {@render trailing()}
      </span>
    {/if}
  </button>
{/if}

<style>
  /* ------------------------------------------------------------------ */
  /* Base                                                                 */
  /* ------------------------------------------------------------------ */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--button-radius);
    font-family: var(--font-sans);
    font-weight: var(--button-font-weight);
    line-height: var(--leading-none);
    white-space: nowrap;
    cursor: pointer;
    text-decoration: none;
    transition:
      background-color var(--button-transition),
      border-color var(--button-transition),
      color var(--button-transition),
      box-shadow var(--button-transition),
      opacity var(--button-transition);
    -webkit-user-select: none;
    user-select: none;
  }

  /* ------------------------------------------------------------------ */
  /* Sizes                                                                */
  /* ------------------------------------------------------------------ */
  .btn--sm {
    height: var(--button-height-sm);
    padding: 0 var(--button-padding-x-sm);
    font-size: var(--button-font-size-sm);
    letter-spacing: var(--tracking-wide);
  }

  .btn--md {
    height: var(--button-height-md);
    padding: 0 var(--button-padding-x-md);
    font-size: var(--button-font-size-md);
  }

  .btn--lg {
    height: var(--button-height-lg);
    padding: 0 var(--button-padding-x-lg);
    font-size: var(--button-font-size-lg);
  }

  /* ------------------------------------------------------------------ */
  /* Variants                                                             */
  /* ------------------------------------------------------------------ */
  .btn--primary {
    background-color: var(--color-brand);
    border-color: var(--color-brand);
    color: var(--color-brand-foreground);
  }

  .btn--primary:hover:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-brand-hover);
    border-color: var(--color-brand-hover);
  }

  .btn--primary:active:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-brand-active);
    border-color: var(--color-brand-active);
  }

  .btn--secondary {
    background-color: transparent;
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }

  .btn--secondary:hover:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-surface-raised);
    border-color: var(--color-border-strong);
  }

  .btn--secondary:active:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-surface-overlay);
  }

  .btn--ghost {
    background-color: transparent;
    border-color: transparent;
    color: var(--color-text-primary);
  }

  .btn--ghost:hover:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-surface-raised);
  }

  .btn--ghost:active:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-surface-overlay);
  }

  .btn--danger {
    background-color: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-danger-foreground);
  }

  .btn--danger:hover:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-danger-hover);
    border-color: var(--color-danger-hover);
  }

  .btn--danger:active:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--color-danger-emphasis);
    border-color: var(--color-danger-emphasis);
  }

  .btn--link {
    background-color: transparent;
    border-color: transparent;
    color: var(--color-text-link);
    text-decoration: underline;
    text-underline-offset: 3px;
    height: auto;
    padding: 0;
  }

  .btn--link:hover:not(:disabled):not([aria-disabled='true']) {
    color: var(--color-text-link-hover);
  }

  /* ------------------------------------------------------------------ */
  /* Full width                                                           */
  /* ------------------------------------------------------------------ */
  .btn--full {
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Disabled                                                             */
  /* ------------------------------------------------------------------ */
  .btn:disabled,
  .btn[aria-disabled='true'] {
    background-color: var(--color-disabled-surface);
    border-color: var(--color-disabled-border);
    color: var(--color-disabled-text);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* link variant disabled — no background to reset */
  .btn--link:disabled,
  .btn--link[aria-disabled='true'] {
    background-color: transparent;
    border-color: transparent;
    color: var(--color-disabled-text);
    text-decoration: none;
  }

  /* ------------------------------------------------------------------ */
  /* Loading state                                                        */
  /* ------------------------------------------------------------------ */
  .btn--loading {
    cursor: wait;
    pointer-events: none;
  }

  .btn__spinner {
    display: block;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: var(--radius-full);
    flex-shrink: 0;
    animation: btn-spin var(--spinner-duration) linear infinite;
  }

  @keyframes btn-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Respect reduced motion — swap spinning animation for a pulse */
  @media (prefers-reduced-motion: reduce) {
    .btn__spinner {
      animation: btn-pulse 1.5s ease-in-out infinite;
      border-top-color: currentColor;
      opacity: 0.5;
    }

    @keyframes btn-pulse {
      0%,
      100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Leading / trailing icon slots                                        */
  /* ------------------------------------------------------------------ */
  .btn__leading,
  .btn__trailing {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    /* Icons passed as children are expected to be 1em × 1em SVGs.
       The em unit scales with the button's font-size automatically. */
    width: 1.125em;
    height: 1.125em;
  }
</style>
