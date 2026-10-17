<!-- Opens a shipment with its first line: posts to this route's `create` action. -->
<script lang="ts">
  import './shipment-create-form.css';
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
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/create" class="shipment-create-form">
  <!-- Field renders the <label for>; the control inherits its id from field context. -->
  <Field label={localText('logistic.field.carrier')} id="shipment-carrier">
    <Input name="carrier" />
  </Field>

  <Field label={localText('logistic.shipment.service_level')} id="shipment-service">
    <Input name="service_level" />
  </Field>

  <Field label={localText('logistic.field.sku')} id="shipment-sku" required>
    <Input name="sku" required />
  </Field>

  <Field label={localText('logistic.shipment.quantity')} id="shipment-quantity" required>
    <Input name="quantity" type="number" min="1" value="1" required />
  </Field>

  <div class="shipment-create-form__actions">
    <Button variant="ghost" onclick={onCancel}>
      {globalDictionary.localText('action.cancel')}
    </Button>
    <Button type="submit" variant="primary">{localText('logistic.shipment.create')}</Button>
  </div>
</form>
