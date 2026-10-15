<!-- Records a carrier scan: posts to this route's `addTrackingEvent` action. -->
<script lang="ts">
  import './tracking-event-add-form.css';
  import { enhance } from '$app/forms';
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

<!-- use:enhance so the forms beside this one keep their unsaved input. -->
<form method="POST" action="?/addTrackingEvent" class="tracking-event-add-form" use:enhance>
  <!-- Free text, not the shipment enum: this records what the carrier called the scan, which
       no enum of ours can enumerate. -->
  <Field label={localText('logistic.shipment.event')} id="event-status" required>
    <Input name="status" required />
  </Field>
  <Field label={localText('logistic.field.storage_location')} id="event-location">
    <Input name="event_location" />
  </Field>
  <Field label={localText('logistic.shipment.event_description')} id="event-description">
    <Input name="description" />
  </Field>
  <div class="tracking-event-add-form__actions">
    <Button type="submit" variant="secondary" size="sm">
      {globalDictionary.localText('action.add')}
    </Button>
  </div>
</form>
