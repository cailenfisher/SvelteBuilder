<!-- Drawer: accessible slide-over panel backed by Bits UI Dialog.
     Camp 1 — i18n-agnostic. Caller provides title and content via snippets. -->
<script module lang="ts">
  export type DrawerSide = 'right' | 'left' | 'bottom';
</script>

<script lang="ts">
  import { Dialog } from 'bits-ui';
  import type { Snippet } from 'svelte';

  type Props = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description?: string;
    side?: DrawerSide;
    children: Snippet;
    trigger?: Snippet;
    footer?: Snippet;
    /** Accessible name for the close button. */
    closeLabel: string;
    class?: string | undefined;
  };

  let {
    open = $bindable(false),
    onOpenChange,
    title,
    description,
    side = 'right',
    children,
    trigger,
    footer,
    closeLabel,
    class: extraClass,
  }: Props = $props();

  const descriptionId = $props.id();
</script>

<Dialog.Root bind:open onOpenChange={(v) => onOpenChange?.(v)}>
  {#if trigger}
    <Dialog.Trigger class="drawer__trigger">
      {@render trigger()}
    </Dialog.Trigger>
  {/if}

  <Dialog.Portal>
    <Dialog.Overlay class="drawer__overlay" />
    <Dialog.Content class={['drawer', `drawer--${side}`, extraClass ?? ''].filter(Boolean).join(' ')} aria-describedby={description ? descriptionId : undefined}>
      <div class="drawer__header">
        <Dialog.Title class="drawer__title">{title}</Dialog.Title>
        {#if description}
          <Dialog.Description id={descriptionId} class="drawer__description">{description}</Dialog.Description>
        {/if}
        <Dialog.Close class="drawer__close" aria-label={closeLabel}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </Dialog.Close>
      </div>

      <div class="drawer__body">
        {@render children()}
      </div>

      {#if footer}
        <div class="drawer__footer">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
