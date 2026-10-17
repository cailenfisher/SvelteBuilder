<!-- Adds an expected line to the receipt: posts to this route's `addInboundReceiptLine`
     action. -->
<script lang="ts">
  import './inbound-receipt-line-add-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Select, SelectItem } from '@sveltebuilder/coreui';
  import type { StorageLocationOption } from '@sveltebuilder/logistic/views';

  type Props = {
    /** Only bins: the coarser levels of the location tree are for navigation and hold no stock. */
    storageLocations: StorageLocationOption[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { storageLocations, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/addInboundReceiptLine" class="inbound-receipt-line-add-form">
  <Field label={localText('logistic.field.sku')} id="line-sku" required>
    <Input name="sku" required />
  </Field>
  <Field label={localText('logistic.field.storage_location')} id="line-location" required>
    <Select name="storage_location_id">
      {#each storageLocations as location (location.id)}
        <SelectItem
          value={String(location.id)}
          label={dictionary.localText('name', 'storage_location', location.id)}
        />
      {/each}
    </Select>
  </Field>
  <Field label={localText('logistic.inbound_receipt.expected_quantity')} id="line-expected" required>
    <Input name="expected_quantity" type="number" min="1" required />
  </Field>
  <Button type="submit" variant="primary" size="sm">
    {globalDictionary.localText('action.add')}
  </Button>
</form>
