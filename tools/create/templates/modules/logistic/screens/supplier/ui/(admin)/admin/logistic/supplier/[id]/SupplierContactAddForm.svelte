<!-- Adds a contact to the supplier: posts to this route's `addSupplierContact` action. -->
<script lang="ts">
  import './supplier-contact-add-form.css';
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

<form method="POST" action="?/addSupplierContact" class="supplier-contact-add-form">
  <div class="supplier-contact-add-form__fields">
    <Field label={localText('logistic.field.role')} id="contact-role" required>
      <Input id="contact-role" name="role" required />
    </Field>
    <Field label={localText('logistic.field.name')} id="contact-name" required>
      <Input id="contact-name" name="name" required />
    </Field>
    <Field label={localText('logistic.field.email')} id="contact-email">
      <Input id="contact-email" name="email" type="email" />
    </Field>
    <Field label={localText('logistic.field.phone')} id="contact-phone">
      <Input id="contact-phone" name="phone" type="tel" />
    </Field>
  </div>
  <Button type="submit" variant="primary">{globalDictionary.localText('action.save')}</Button>
</form>
