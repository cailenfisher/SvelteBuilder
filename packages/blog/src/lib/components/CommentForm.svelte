<!-- Camp 1: i18n-agnostic. Caller resolves all label strings. No hermes import. -->
<script lang="ts">
  import { Field, Label, Textarea, Button, Alert } from '@sveltebuilder/coreui';

  type Props = {
    label: string;
    submitLabel: string;
    cancelLabel?: string;
    loading?: boolean;
    error?: string;
    onsubmit: (body: string) => void;
    oncancel?: () => void;
    class?: string | undefined;
  };

  let {
    label,
    submitLabel,
    cancelLabel,
    loading = false,
    error,
    onsubmit,
    oncancel,
    class: extraClass,
  }: Props = $props();

  let body = $state('');

  const fieldId = 'comment-body';

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (body.trim()) {
      onsubmit(body.trim());
    }
  }

  const classes = $derived(
    ['comment-form', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<form class={classes} onsubmit={handleSubmit} method="post">
  <h3 class="comment-form__title">{label}</h3>

  {#if error}
    <Alert variant="danger">{error}</Alert>
  {/if}

  <Field>
    <Label for={fieldId}>{label}</Label>
    <Textarea
      id={fieldId}
      bind:value={body}
      disabled={loading}
      rows={4}
      required
      aria-describedby={error ? 'comment-form-error' : undefined}
    />
  </Field>

  <div class="comment-form__actions">
    <Button type="submit" variant="primary" disabled={loading || !body.trim()}>
      {loading ? '…' : submitLabel}
    </Button>

    {#if cancelLabel && oncancel}
      <Button type="button" variant="ghost" onclick={oncancel} disabled={loading}>
        {cancelLabel}
      </Button>
    {/if}
  </div>
</form>

<style>
  .comment-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .comment-form__title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .comment-form__actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
</style>
