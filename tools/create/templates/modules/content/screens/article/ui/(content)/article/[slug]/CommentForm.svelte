<!-- Leaves a comment on the article: posts to this route's `comment` action. There is no status
     field: a comment is created pending, and the RLS insert policy is what enforces that rather
     than this form omitting it. -->
<script lang="ts">
  import './comment-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Field, Input, InlineNotification, Textarea } from '@sveltebuilder/coreui';

  type Props = {
    /** The action's answer to the last submission, if it refused it. */
    error?: string;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { error, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'content');
</script>

<form class="comment-form" method="POST" action="?/comment">
  <h3 class="comment-form__heading">{localText('content.comment.leave')}</h3>

  {#if error}
    <InlineNotification severity="danger" summary={error} />
  {/if}

  <Field label={localText('content.comment.name')} id="comment-name" required>
    <Input name="author_name" required />
  </Field>
  <Field label={localText('content.comment.email')} id="comment-email" required>
    <Input name="author_email" type="email" required />
  </Field>
  <Field label={localText('content.comment.body')} id="comment-body" required>
    <Textarea name="body" rows={5} required />
  </Field>

  <Button type="submit" variant="primary">{localText('content.comment.submit')}</Button>
</form>
