<!-- The carrier, service level and tracking number: posts to this route's `updateTracking`
     action. -->
<script lang="ts">
  import './shipment-tracking-form.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input } from '@sveltebuilder/coreui';
  import type { Shipment } from '@sveltebuilder/logistic';

  type Props = {
    shipment: Shipment;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { shipment, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<!-- use:enhance so the forms beside this one keep their unsaved input. -->
<form method="POST" action="?/updateTracking" class="shipment-tracking-form" use:enhance>
  <Field label={localText('logistic.field.carrier')} id="shipment-carrier">
    <Input name="carrier" value={shipment.carrier ?? ''} />
  </Field>
  <Field label={localText('logistic.shipment.service_level')} id="shipment-service">
    <Input name="service_level" value={shipment.serviceLevel ?? ''} />
  </Field>
  <Field label={localText('logistic.field.tracking_number')} id="shipment-tracking">
    <Input name="tracking_number" value={shipment.trackingNumber ?? ''} />
  </Field>
  <div class="shipment-tracking-form__actions">
    <Button type="submit" variant="secondary" size="sm">
      {globalDictionary.localText('action.save')}
    </Button>
  </div>
</form>
