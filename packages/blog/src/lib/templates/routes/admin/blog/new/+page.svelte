<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Button, Field, Label, Select, SelectItem, Switch } from '@sveltebuilder/coreui';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  const title     = $derived(localText('blog.admin.post.new', 'blog'));
  const saveLabel = $derived(localText('blog.admin.post.save_draft', 'blog'));
  const cancelLabel = $derived(localText('action.cancel'));
</script>

<div class="admin-post-form">
  <header class="admin-post-form__header">
    <h1 class="admin-post-form__title">{title}</h1>
  </header>

  <!-- NOTE: This form manages only structural post fields (status, featured, allowComment).
       Title, body, and excerpt copy are entered through the main LocalText admin UI. -->

  {#if form?.message}
    <p class="admin-post-form__error" role="alert">{form.message}</p>
  {/if}

  <form class="admin-post-form__form" method="post">
    <Field>
      <Label for="status">{localText('blog.status.draft', 'blog')}</Label>
      <Select id="status" name="status" value="draft">
        <SelectItem value="draft">{localText('blog.status.draft', 'blog')}</SelectItem>
        <SelectItem value="review">{localText('blog.status.review', 'blog')}</SelectItem>
        <SelectItem value="published">{localText('blog.status.published', 'blog')}</SelectItem>
        <SelectItem value="archived">{localText('blog.status.archived', 'blog')}</SelectItem>
      </Select>
    </Field>

    <div class="admin-post-form__switches">
      <Field>
        <Switch id="featured" name="featured" label="Featured" />
      </Field>

      <Field>
        <Switch id="allow_comment" name="allow_comment" label="Allow comments" checked />
      </Field>
    </div>

    <div class="admin-post-form__actions">
      <Button type="submit" variant="primary">{saveLabel}</Button>
      <Button href="/admin/blog" variant="ghost">{cancelLabel}</Button>
    </div>
  </form>
</div>

<style>
  .admin-post-form {
    max-width: 36rem;
    margin-inline: auto;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .admin-post-form__header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .admin-post-form__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .admin-post-form__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .admin-post-form__switches {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .admin-post-form__actions {
    display: flex;
    gap: var(--space-3);
    padding-block-start: var(--space-2);
  }

  .admin-post-form__error {
    color: var(--danger-text);
    background-color: var(--danger-soft);
    border: 1px solid var(--danger-border);
    border-radius: var(--radius-lg);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    margin: 0;
  }
</style>
