<!-- Grades one returned line: how many arrived, in what condition, and what happens to them.
     Posts to this route's `gradeReturnAuthorizationLine` action. -->
<script lang="ts">
  import './return-authorization-line-grade-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Input, Select, SelectItem } from '@sveltebuilder/coreui';
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
</script>

<form
  method="POST"
  action="?/gradeReturnAuthorizationLine"
  class="return-authorization-line-grade-form"
>
  <input type="hidden" name="return_authorization_line_id" value={returnAuthorizationLine.id} />
  <Input
    name="received_quantity"
    type="number"
    min="0"
    value={String(returnAuthorizationLine.receivedQuantity)}
    aria-label={localText('logistic.return_authorization.received_quantity')}
  />
  <Select name="condition" value={returnAuthorizationLine.condition ?? ''}>
    {#each conditions as condition (condition)}
      <SelectItem
        value={condition}
        label={localText(`logistic.return_authorization.condition.${condition}`)}
      />
    {/each}
  </Select>
  <Select name="disposition" value={returnAuthorizationLine.disposition ?? ''}>
    {#each dispositions as disposition (disposition)}
      <SelectItem
        value={disposition}
        label={localText(`logistic.return_authorization.disposition.${disposition}`)}
      />
    {/each}
  </Select>
  <!-- Only needed for a restock, but offered always: which disposition the operator picks is
       not known until they submit. The loader validates the pairing. -->
  <Select name="storage_location_id">
    <SelectItem value="" label={localText('logistic.return_authorization.no_location')} />
    {#each storageLocations as location (location.id)}
      <SelectItem
        value={String(location.id)}
        label={dictionary.localText('name', 'storage_location', location.id)}
      />
    {/each}
  </Select>
  <Button type="submit" variant="primary" size="sm">
    {localText('logistic.return_authorization.grade')}
  </Button>
</form>
