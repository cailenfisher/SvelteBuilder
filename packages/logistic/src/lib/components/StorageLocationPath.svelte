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

<nav class={classes} aria-label="Storage location path">
  <ol class="storage-location-path__list">
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
</nav>

<style>
  .storage-location-path__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0;
  }

  .storage-location-path__segment {
    display: flex;
    align-items: center;
  }

  .storage-location-path__name {
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .storage-location-path__name--current {
    font-weight: var(--weight-medium);
    color: var(--text);
  }

  .storage-location-path__separator {
    font-size: var(--text-sm);
    color: var(--text-soft);
    padding-inline: var(--space-1);
  }
</style>
