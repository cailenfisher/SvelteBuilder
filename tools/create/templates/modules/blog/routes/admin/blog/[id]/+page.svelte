<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Button, Field, Select, SelectItem, Switch, Input, Alert } from '@sveltebuilder/coreui';
  import { PostStatusBadge } from '@sveltebuilder/blog';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const editLabel         = $derived(localText('blog.admin.post.edit', 'blog'));
  const saveLabel         = $derived(localText('blog.admin.post.save_draft', 'blog'));
  const publishLabel      = $derived(localText('blog.admin.post.publish', 'blog'));
  const unpublishLabel    = $derived(localText('blog.admin.post.unpublish', 'blog'));
  const cancelLabel       = $derived(localText('action.cancel'));
  const statusLabel       = $derived(localText(`blog.status.${data.post.status}`, 'blog'));
  const fieldStatus       = $derived(localText('blog.field.status', 'blog'));
  const fieldReadingTime  = $derived(localText('blog.field.reading_time_minute', 'blog'));
  const fieldFeatured     = $derived(localText('blog.field.featured', 'blog'));
  const fieldAllowComment = $derived(localText('blog.field.allow_comment', 'blog'));
</script>

<div class="admin-post-form">
  <header class="admin-post-form__header">
    <div class="admin-post-form__title-row">
      <h1 class="admin-post-form__title">{editLabel}</h1>
      <PostStatusBadge status={data.post.status} label={statusLabel} />
    </div>

    <div class="admin-post-form__publish-actions">
      {#if data.post.status !== 'published'}
        <form method="post" action="?/publish">
          <Button type="submit" variant="primary">{publishLabel}</Button>
        </form>
      {:else}
        <form method="post" action="?/unpublish">
          <Button type="submit" variant="ghost">{unpublishLabel}</Button>
        </form>
      {/if}
    </div>
  </header>

  <!-- NOTE: This form manages only structural post fields (status, featured, allowComment,
       reading_time_minute). Title, body, and excerpt copy are entered through the main
       LocalText admin UI, not here. -->

  {#if form?.message}
    <Alert variant="danger">{form.message}</Alert>
  {/if}

  {#if form?.success}
    <Alert variant="success">{localText('feedback.saved')}</Alert>
  {/if}

  <form class="admin-post-form__form" method="post" action="?/save">
    <Field label={fieldStatus} id="status">
      <Select id="status" name="status" value={data.post.status}>
        <SelectItem value="draft">{localText('blog.status.draft', 'blog')}</SelectItem>
        <SelectItem value="review">{localText('blog.status.review', 'blog')}</SelectItem>
        <SelectItem value="published">{localText('blog.status.published', 'blog')}</SelectItem>
        <SelectItem value="archived">{localText('blog.status.archived', 'blog')}</SelectItem>
      </Select>
    </Field>

    <Field label={fieldReadingTime} id="reading_time_minute">
      <Input
        id="reading_time_minute"
        name="reading_time_minute"
        type="number"
        min="1"
        value={data.post.readingTimeMinute ?? ''}
      />
    </Field>

    <div class="admin-post-form__switches">
      <Switch
        id="featured"
        name="featured"
        label={fieldFeatured}
        checked={data.post.featured}
      />

      <Switch
        id="allow_comment"
        name="allow_comment"
        label={fieldAllowComment}
        checked={data.post.allowComment}
      />
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
    flex-direction: column;
    gap: var(--space-3);
  }

  .admin-post-form__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .admin-post-form__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .admin-post-form__publish-actions {
    display: flex;
    gap: var(--space-2);
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
</style>
