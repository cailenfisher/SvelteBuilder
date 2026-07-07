<!-- Drawer: accessible slide-over panel backed by Bits UI Dialog.
     Camp 1 — i18n-agnostic. Caller provides title and content via snippets. -->
<script lang="ts">
  import * as Dialog from 'bits-ui';
  import type { Snippet } from 'svelte';

  type Side = 'right' | 'left' | 'bottom';

  type Props = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description?: string;
    side?: Side;
    children: Snippet;
    trigger?: Snippet;
    footer?: Snippet;
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
    class: extraClass,
  }: Props = $props();
</script>

<Dialog.Root bind:open onOpenChange={(v) => onOpenChange?.(v)}>
  {#if trigger}
    <Dialog.Trigger>
      {@render trigger()}
    </Dialog.Trigger>
  {/if}

  <Dialog.Portal>
    <Dialog.Overlay class="drawer-overlay" />
    <Dialog.Content class={['drawer', `drawer--${side}`, extraClass ?? ''].filter(Boolean).join(' ')} aria-describedby={description ? 'drawer-desc' : undefined}>
      <div class="drawer-header">
        <Dialog.Title class="drawer-title">{title}</Dialog.Title>
        {#if description}
          <Dialog.Description id="drawer-desc" class="drawer-description">{description}</Dialog.Description>
        {/if}
        <Dialog.Close class="drawer-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </Dialog.Close>
      </div>

      <div class="drawer-body">
        {@render children()}
      </div>

      {#if footer}
        <div class="drawer-footer">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
