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
    ['dialog', size, extraClass ?? ''].filter(Boolean).join(' ')
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
      <div class="header">
        <Dialog.Title class="dialog-title" level={2}>
          {title}
        </Dialog.Title>

        <Dialog.Close class="dialog-close" aria-label="Close dialog">
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </Dialog.Close>
      </div>

      {#if description}
        <Dialog.Description id={descId} class="dialog-desc">
          {description}
        </Dialog.Description>
      {:else}
        <Dialog.Description class="dialog-desc hidden">
          {title} dialog
        </Dialog.Description>
      {/if}

      <div class="body">
        {@render children()}
      </div>

      {#if footer}
        <div class="footer">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>