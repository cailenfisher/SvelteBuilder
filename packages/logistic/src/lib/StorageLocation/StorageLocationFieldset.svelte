<!-- Choose any number of storage locations: one checkbox per location, named by its copy.
     A real <fieldset> placed inside a form someone else owns; each checkbox posts the
     location's id under `name`. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Checkbox } from '@sveltebuilder/coreui';
  import type { StorageLocation } from '../schema/index.js';

  type Props = {
    storageLocations: Pick<StorageLocation, 'id'>[];
    /** The form field every checked location's id is posted under. */
    name: string;
    /** Names the group; omit it only when something around the fieldset already does. */
    legend?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { storageLocations, name, legend, dictionary: dictionaryProp, class: extraClass }: Props =
    $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const classes = $derived(
    ['storage-location-fieldset', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<fieldset class={classes}>
  {#if legend}
    <legend class="storage-location-fieldset__legend">{legend}</legend>
  {/if}
  {#each storageLocations as location (location.id)}
    <!-- Checkbox is self-labelling, so it is not wrapped in a Field: that would nest one
         label inside another and leave the outer for= dangling. -->
    <Checkbox
      {name}
      value={String(location.id)}
      label={dictionary.localText('name', 'storage_location', location.id)}
    />
  {/each}
</fieldset>
