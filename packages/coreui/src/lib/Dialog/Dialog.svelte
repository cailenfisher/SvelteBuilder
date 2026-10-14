<script module lang="ts">
  export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Dialog } from 'bits-ui';

  type Props = {
    open?: boolean;
    /** Called when the overlay opens or closes, with the new state. */
    onOpenChange?: (open: boolean) => void;
    size?: DialogSize;
    title: string;
    description?: string;
    children: Snippet;
    footer?: Snippet;
    trigger?: Snippet;
    /** Accessible name for the close button. */
    closeLabel: string;
    class?: string | undefined;
  };

  let {
    open = $bindable(false),
    onOpenChange,
    size = 'md',
    title,
    description,
    children,
    footer,
    trigger,
    closeLabel,
    class: extraClass,
  }: Props = $props();

  const contentClasses = $derived(
    ['dialog', `dialog--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Dialog.Root bind:open {onOpenChange}>
  {#if trigger}
    <Dialog.Trigger class="dialog__trigger">
      {@render trigger()}
    </Dialog.Trigger>
  {/if}

  <Dialog.Portal>
    <Dialog.Overlay class="dialog__overlay" />

    <Dialog.Content class={contentClasses}>
      <div class="dialog__header">
        <Dialog.Title class="dialog__title" level={2}>
          {title}
        </Dialog.Title>

        <Dialog.Close class="dialog__close" aria-label={closeLabel}>
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </Dialog.Close>
      </div>

      {#if description}
        <Dialog.Description class="dialog__description">
          {description}
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