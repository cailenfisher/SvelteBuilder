<!-- Opens a return with its first line: posts to this route's `create` action. -->
<script lang="ts">
  import './return-authorization-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Textarea } from '@sveltebuilder/coreui';

  type Props = {
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
    onCancel: () => void;
  };

  let { dictionary, onCancel }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/create" class="return-authorization-create-form">
  <Field label={localText('logistic.field.sku')} id="return-sku" required>
    <Input name="sku" required />
  </Field>
  <Field label={localText('logistic.return_authorization.expected_quantity')} id="return-quantity" required>
    <Input name="expected_quantity" type="number" min="1" value="1" required />
  </Field>
  <Field label={localText('logistic.return_authorization.reason')} id="return-reason">
    <Input name="reason" />
  </Field>
  <Field label={localText('logistic.field.note')} id="return-note">
    <Textarea name="note" rows={3} />
  </Field>

  <div class="return-authorization-create-form__actions">
    <Button variant="ghost" onclick={onCancel}>
      {globalDictionary.localText('action.cancel')}
    </Button>
    <Button type="submit" variant="primary">{localText('logistic.return_authorization.create')}</Button>
  </div>
</form>
