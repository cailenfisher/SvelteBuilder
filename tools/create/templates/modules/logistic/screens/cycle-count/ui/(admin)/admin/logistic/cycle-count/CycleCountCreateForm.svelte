<!-- Opens a count over the chosen bins: posts to this route's `create` action. -->
<script lang="ts">
  import './cycle-count-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button } from '@sveltebuilder/coreui';
  import { StorageLocationFieldset } from '@sveltebuilder/logistic';
  import type { StorageLocationOption } from '@sveltebuilder/logistic/views';

  type Props = {
    storageLocations: StorageLocationOption[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
    onCancel: () => void;
  };

  let { storageLocations, dictionary, onCancel }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form method="POST" action="?/create" class="cycle-count-create-form">
  <StorageLocationFieldset
    {storageLocations}
    name="storage_location_ids"
    legend={localText('logistic.cycle_count.choose_locations')}
    {dictionary}
  />

  <div class="cycle-count-create-form__actions">
    <Button variant="ghost" onclick={onCancel}>
      {globalDictionary.localText('action.cancel')}
    </Button>
    <Button type="submit" variant="primary">{localText('logistic.cycle_count.create')}</Button>
  </div>
</form>
