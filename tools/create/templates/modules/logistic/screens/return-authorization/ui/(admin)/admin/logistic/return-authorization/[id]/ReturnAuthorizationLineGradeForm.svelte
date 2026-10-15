<!-- Grades one returned line: how many arrived, in what condition, and what happens to them.
     Posts to this route's `gradeReturnAuthorizationLine` action. -->
<script lang="ts">
  import './return-authorization-line-grade-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Field, Input, Select, SelectItem } from '@sveltebuilder/coreui';
  import type {
    ReturnAuthorizationLine,
    ReturnCondition,
    ReturnDisposition,
  } from '@sveltebuilder/logistic';
  import type { StorageLocationOption } from '@sveltebuilder/logistic/views';

  type Props = {
    returnAuthorizationLine: ReturnAuthorizationLine;
    conditions: readonly ReturnCondition[];
    dispositions: readonly ReturnDisposition[];
    /** Where restocked goods can go: bins only. */
    storageLocations: StorageLocationOption[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { returnAuthorizationLine, conditions, dispositions, storageLocations, dictionary }: Props =
    $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  // One form per line, so each field's id carries the line's.
  const fieldId = (field: string) => `return-authorization-line-${returnAuthorizationLine.id}-${field}`;
</script>

<form
  method="POST"
  action="?/gradeReturnAuthorizationLine"
  class="return-authorization-line-grade-form"
>
  <input type="hidden" name="return_authorization_line_id" value={returnAuthorizationLine.id} />
  <Field label={localText('logistic.return_authorization.received_quantity')} id={fieldId('received-quantity')}>
    <Input
      name="received_quantity"
      type="number"
      min="0"
      value={String(returnAuthorizationLine.receivedQuantity)}
    />
  </Field>
  <Field label={localText('logistic.return_authorization.condition')} id={fieldId('condition')}>
    <Select name="condition" value={returnAuthorizationLine.condition ?? ''}>
      {#each conditions as condition (condition)}
        <SelectItem
          value={condition}
          label={localText(`logistic.return_authorization.condition.${condition}`)}
        />
      {/each}
    </Select>
  </Field>
  <Field label={localText('logistic.return_authorization.disposition')} id={fieldId('disposition')}>
    <Select name="disposition" value={returnAuthorizationLine.disposition ?? ''}>
      {#each dispositions as disposition (disposition)}
        <SelectItem
          value={disposition}
          label={localText(`logistic.return_authorization.disposition.${disposition}`)}
        />
      {/each}
    </Select>
  </Field>
  <!-- Only needed for a restock, but offered always: which disposition the operator picks is
       not known until they submit. The loader validates the pairing. -->
  <Field label={localText('logistic.field.storage_location')} id={fieldId('storage-location')}>
    <Select name="storage_location_id">
      <SelectItem value="" label={localText('logistic.return_authorization.no_location')} />
      {#each storageLocations as location (location.id)}
        <SelectItem
          value={String(location.id)}
          label={dictionary.localText('name', 'storage_location', location.id)}
        />
      {/each}
    </Select>
  </Field>
  <Button type="submit" variant="primary" size="sm">
    {localText('logistic.return_authorization.grade')}
  </Button>
</form>
