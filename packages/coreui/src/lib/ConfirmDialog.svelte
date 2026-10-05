<script lang="ts">
  import type { Snippet } from 'svelte';
  import { AlertDialog } from 'bits-ui';
  import Button from './Button.svelte';

  type Props = {
    open?: boolean;
    title: string;
    description?: string;
    /**
     * Label for the destructive confirm button. Defaults to "Confirm".
     * Use specific action language: "Delete", "Archive", "Remove".
     */
    confirmLabel?: string;
    /**
     * Label for the cancel button. Defaults to "Cancel".
     */
    cancelLabel?: string;
    /**
     * Set true when the confirm action is in-flight (shows loading state).
     */
    loading?: boolean;
    children?: Snippet;
    onConfirm: () => void;
    /** Called when the dialog is dismissed by the cancel button or Escape. */
    onCancel?: () => void;
  };

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    loading = false,
    children,
    onConfirm,
    onCancel,
  }: Props = $props();
</script>

<!--
  AlertDialog rather than Dialog: role="alertdialog", and an outside click does
  not dismiss it — a stray click must never stand in for an answer to a
  destructive confirmation. onOpenChange fires only for dismissals the dialog
  performs itself (cancel, Escape), never when the parent closes it after
  onConfirm, so it is exactly the cancel path.
-->
<AlertDialog.Root
  bind:open
  onOpenChange={(next) => {
    if (!next) onCancel?.();
  }}
>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="dialog-overlay" />

    <AlertDialog.Content
      class="dialog sm"
      escapeKeydownBehavior={loading ? 'ignore' : 'close'}
    >
      <div class="header">
        <AlertDialog.Title class="dialog-title" level={2}>
          {title}
        </AlertDialog.Title>
      </div>

      {#if description}
        <AlertDialog.Description class="dialog-desc">
          {description}
        </AlertDialog.Description>
      {/if}

      {#if children}
        <div class="body">
          {@render children()}
        </div>
      {/if}

      <div class="footer">
        <AlertDialog.Cancel disabled={loading}>
          {#snippet child({ props })}
            <Button variant="secondary" {...props}>
              {cancelLabel}
            </Button>
          {/snippet}
        </AlertDialog.Cancel>
        <Button variant="danger" onclick={onConfirm} {loading}>
          {confirmLabel}
        </Button>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
