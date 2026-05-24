<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Dialog } from 'bits-ui';

  type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full';

  type Props = {
    open?: boolean;
    size?: Size;
    title: string;
    description?: string;
    children: Snippet;
    footer?: Snippet;
    trigger?: Snippet;
    class?: string | undefined;
  };

  let {
    open = $bindable(false),
    size = 'md',
    title,
    description,
    children,
    footer,
    trigger,
    class: extraClass,
  }: Props = $props();

  const descId = `dialog-desc-${Math.random().toString(36).slice(2, 9)}`;

  const contentClasses = $derived(
    ['dialog', `dialog--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Dialog.Root bind:open>
  {#if trigger}
    <Dialog.Trigger class="dialog-trigger">
      {@render trigger()}
    </Dialog.Trigger>
  {/if}

  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />

    <Dialog.Content class={contentClasses} aria-describedby={description ? descId : undefined}>
      <div class="dialog__header">
        <Dialog.Title class="dialog__title" level={2}>
          {title}
        </Dialog.Title>

        <Dialog.Close class="dialog__close" aria-label="Close dialog">
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </Dialog.Close>
      </div>

      {#if description}
        <Dialog.Description id={descId} class="dialog__description">
          {description}
        </Dialog.Description>
      {:else}
        <!-- Visually hidden description satisfies ARIA labelling requirements -->
        <Dialog.Description class="dialog__description dialog__description--hidden">
          {title} dialog
        </Dialog.Description>
      {/if}

      <div class="dialog__body">
        {@render children()}
      </div>

      {#if footer}
        <div class="dialog__footer">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  /* ------------------------------------------------------------------ */
  /* Overlay                                                              */
  /* ------------------------------------------------------------------ */
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background-color: var(--color-overlay-backdrop);
    z-index: var(--z-overlay);
    animation: dialog-overlay-in var(--duration-normal) var(--ease-out);
  }

  :global(.dialog-overlay[data-state="closed"]) {
    animation: dialog-overlay-out var(--duration-fast) var(--ease-out);
  }

  @keyframes dialog-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes dialog-overlay-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* ------------------------------------------------------------------ */
  /* Content panel                                                        */
  /* ------------------------------------------------------------------ */
  :global(.dialog) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--dialog-bg);
    border-radius: var(--dialog-radius);
    box-shadow: var(--dialog-shadow);
    z-index: var(--z-modal);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 4rem);
    width: calc(100% - 2rem);
    animation: dialog-in var(--duration-normal) var(--ease-spring);
  }

  :global(.dialog[data-state="closed"]) {
    animation: dialog-out var(--duration-fast) var(--ease-out);
  }

  @keyframes dialog-in {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  @keyframes dialog-out {
    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    to   { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  }

  /* Sizes */
  :global(.dialog--sm)   { max-width: var(--dialog-width-sm); }
  :global(.dialog--md)   { max-width: var(--dialog-width-md); }
  :global(.dialog--lg)   { max-width: var(--dialog-width-lg); }
  :global(.dialog--xl)   { max-width: var(--dialog-width-xl); }
  :global(.dialog--full) {
    max-width: var(--dialog-width-full);
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    top: 0;
    left: 0;
    transform: none;
  }

  /* ------------------------------------------------------------------ */
  /* Trigger (passthrough)                                                */
  /* ------------------------------------------------------------------ */
  :global(.dialog-trigger) {
    display: contents;
  }

  /* ------------------------------------------------------------------ */
  /* Header                                                               */
  /* ------------------------------------------------------------------ */
  .dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--dialog-padding) var(--dialog-padding) 0;
    flex-shrink: 0;
  }

  :global(.dialog__title) {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    line-height: var(--leading-snug);
    margin: 0;
  }

  :global(.dialog__close) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color var(--duration-fast) var(--ease-out);
  }

  :global(.dialog__close:hover) {
    background-color: var(--color-surface-raised);
    color: var(--color-text-primary);
  }

  :global(.dialog__close:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* ------------------------------------------------------------------ */
  /* Description                                                          */
  /* ------------------------------------------------------------------ */
  :global(.dialog__description) {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-normal);
    padding: var(--space-2) var(--dialog-padding) 0;
    margin: 0;
    flex-shrink: 0;
  }

  :global(.dialog__description--hidden) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ------------------------------------------------------------------ */
  /* Body                                                                 */
  /* ------------------------------------------------------------------ */
  .dialog__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--dialog-padding);
  }

  /* ------------------------------------------------------------------ */
  /* Footer                                                               */
  /* ------------------------------------------------------------------ */
  .dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: 0 var(--dialog-padding) var(--dialog-padding);
    flex-shrink: 0;
    border-top: 1px solid var(--color-border-subtle);
  }
</style>
