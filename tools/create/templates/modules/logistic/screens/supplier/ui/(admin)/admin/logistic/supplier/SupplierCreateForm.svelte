<!-- Adds a supplier with its name in the active locale: posts to this route's `create` action.
     Creating a supplier is three statements (the row, its local_text_link, its local_text), so
     the action calls an RPC; further translations are the local-text admin's job. -->
<script lang="ts">
  import './supplier-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input } from '@sveltebuilder/coreui';

  type Props = {
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/create" class="supplier-create-form">
  <div class="supplier-create-form__fields">
    <Field label={localText('logistic.field.slug')} id="new-supplier-slug" required>
      <Input name="slug" required />
    </Field>
    <Field label={localText('logistic.field.name')} id="new-supplier-name" required>
      <Input name="name" required />
    </Field>
    <Field label={localText('logistic.field.lead_time_day')} id="new-supplier-lead-time">
      <Input name="lead_time_day" type="number" min="0" />
    </Field>
  </div>
  <Button type="submit" variant="primary">{globalDictionary.localText('action.save')}</Button>
</form>
