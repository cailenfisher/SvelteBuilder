<!-- Moves the shipment to another status: posts to this route's `updateStatus` action. -->
<script lang="ts">
  import './shipment-status-form.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Field, Select, SelectItem } from '@sveltebuilder/coreui';
  import type { Shipment, ShipmentStatus } from '@sveltebuilder/logistic';

  type Props = {
    shipment: Shipment;
    statuses: readonly ShipmentStatus[];
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { shipment, statuses, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<!-- use:enhance so the forms beside this one keep their unsaved input. -->
<form method="POST" action="?/updateStatus" class="shipment-status-form" use:enhance>
  <Field label={localText('logistic.shipment.status_label')} id="shipment-status" required>
    <Select name="status" value={shipment.status}>
      {#each statuses as status (status)}
        <SelectItem value={status} label={localText(`logistic.shipment.status.${status}`)} />
      {/each}
    </Select>
  </Field>
  <div class="shipment-status-form__actions">
    <Button type="submit" variant="primary" size="sm">
      {localText('logistic.shipment.status_update')}
    </Button>
  </div>
</form>
