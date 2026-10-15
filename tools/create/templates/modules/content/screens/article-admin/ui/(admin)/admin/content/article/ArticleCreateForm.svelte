<!-- Starts an article with its headline: posts to this route's `create` action. Both fields are
     required: an article with no headline cannot be told apart from its siblings in the list,
     which is the only place an editor will look for it. -->
<script lang="ts">
  import './article-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input } from '@sveltebuilder/coreui';

  type Props = {
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
    onCancel: () => void;
  };

  let { dictionary, onCancel }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'content');
</script>

<form method="POST" action="?/create" class="article-create-form">
  <Field label={localText('content.article_admin.headline')} id="new-headline" required>
    <Input name="headline" required />
  </Field>
  <Field label={localText('content.article_admin.slug')} id="new-slug" required>
    <Input name="canonical_slug" required />
  </Field>

  <div class="article-create-form__actions">
    <Button variant="ghost" onclick={onCancel}>
      {globalDictionary.localText('action.cancel')}
    </Button>
    <Button type="submit" variant="primary">{localText('content.article_admin.create')}</Button>
  </div>
</form>
