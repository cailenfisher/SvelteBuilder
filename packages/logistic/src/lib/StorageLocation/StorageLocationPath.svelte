<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { StorageLocation } from '../schema/index.js';

  type Props = {
    location: StorageLocation;
    ancestors?: StorageLocation[];
    separator?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { location, ancestors = [], separator = ' › ', dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  // Build the full path from root to current location
  const fullPath = $derived([...ancestors, location]);

  const classes = $derived(
    ['storage-location-path', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<!-- A list, not a nav landmark: the segments are names, not links, and a pick task shows one
     path per line. -->
<div class={classes}>
  <ol
    class="storage-location-path__list"
    aria-label={dictionary.localText('logistic.storage_location.path', 'logistic')}
  >
    {#each fullPath as loc, index (loc.id)}
      <li class="storage-location-path__segment">
        <span
          class="storage-location-path__name"
          class:storage-location-path__name--current={index === fullPath.length - 1}
          aria-current={index === fullPath.length - 1 ? 'location' : undefined}
        >
          {dictionary.localText('name', 'storage_location', loc.id)}
        </span>

        {#if index < fullPath.length - 1}
          <span class="storage-location-path__separator" aria-hidden="true">{separator}</span>
        {/if}
      </li>
    {/each}
  </ol>
</div>
