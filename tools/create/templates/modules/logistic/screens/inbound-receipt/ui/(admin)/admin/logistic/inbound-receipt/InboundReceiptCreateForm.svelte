<!-- Opens a receipt: posts to this route's `create` action. -->
<script lang="ts">
  import './inbound-receipt-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Select, SelectItem, Textarea } from '@sveltebuilder/coreui';
  import type { EntityOption } from '@sveltebuilder/logistic/views';

  type Props = {
    suppliers: EntityOption[];
    /** The screen's scoped dictionary: module copy and every supplier's name. */
    dictionary: DictionaryInstance;
    onCancel: () => void;
  };

  let { suppliers, dictionary, onCancel }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/create" class="inbound-receipt-create-form">
  <!-- Field renders the <label for>; the control inherits its id from field context. -->
  <Field label={localText('logistic.inbound_receipt.supplier')} id="supplier-id">
    <Select name="supplier_id">
      <!-- No supplier is a blind receipt, not a missing answer. -->
      <SelectItem value="" label={localText('logistic.inbound_receipt.blind')} />
      {#each suppliers as supplier (supplier.id)}
        <SelectItem
          value={String(supplier.id)}
          label={dictionary.localText('name', 'supplier', supplier.id)}
        />
      {/each}
    </Select>
  </Field>

  <Field label={localText('logistic.inbound_receipt.expected_at')} id="expected-at">
    <Input name="expected_at" type="date" />
  </Field>

  <Field label={localText('logistic.field.note')} id="receipt-note">
    <Textarea name="note" rows={3} />
  </Field>

  <div class="inbound-receipt-create-form__actions">
    <Button variant="ghost" onclick={onCancel}>
      {globalDictionary.localText('action.cancel')}
    </Button>
    <Button type="submit" variant="primary">{localText('logistic.inbound_receipt.create')}</Button>
  </div>
</form>
