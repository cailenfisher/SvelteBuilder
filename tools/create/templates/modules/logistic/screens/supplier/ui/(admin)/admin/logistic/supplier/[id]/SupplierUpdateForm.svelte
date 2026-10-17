<!-- The supplier's own fields: posts to this route's `update` action. Its name is copy, edited
     through the local-text admin. -->
<script lang="ts">
  import './supplier-update-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Switch } from '@sveltebuilder/coreui';
  import type { Supplier } from '@sveltebuilder/logistic';

  type Props = {
    supplier: Supplier;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { supplier, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/update" class="supplier-update-form">
  <Field label={localText('logistic.field.slug')} id="supplier-slug" required>
    <Input id="supplier-slug" name="slug" value={supplier.slug} required />
  </Field>

  <Field label={localText('logistic.field.lead_time_day')} id="supplier-lead-time">
    <Input
      id="supplier-lead-time"
      name="lead_time_day"
      type="number"
      min="0"
      value={supplier.leadTimeDay ?? ''}
    />
  </Field>

  <!-- Switch is self-labelling: it renders its own <label> around the control, so it takes
       the label directly. Wrapping it in a Field would nest labels. The hidden input is what
       actually submits, since the switch is not a form control the browser serialises. -->
  <input type="hidden" name="active" value={supplier.active ? 'true' : 'false'} />
  <Switch checked={supplier.active} label={localText('logistic.field.active')} />

  <Button type="submit" variant="primary">{globalDictionary.localText('action.save')}</Button>
</form>
