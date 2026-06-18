<script lang="ts">
  import type { Snippet } from 'svelte';
  import Dialog from './Dialog.svelte';
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

  function handleCancel() {
    open = false;
    onCancel?.();
  }

  function handleConfirm() {
    onConfirm();
  }
</script>

<Dialog
  bind:open
  size="sm"
  {title}
  {description}
>
  {#if children}
    {@render children()}
  {/if}

  {#snippet footer()}
    <Button variant="secondary" onclick={handleCancel} disabled={loading}>
      {cancelLabel}
    </Button>
    <Button variant="danger" onclick={handleConfirm} {loading}>
      {confirmLabel}
    </Button>
  {/snippet}
</Dialog>
