<!-- Resolves the live update's text from the dictionary. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import type { LiveUpdate } from '../schema/index.js';

  type Props = {
    liveUpdate: LiveUpdate;
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { liveUpdate, locale, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const text = $derived(dictionary.localText('text', 'live_update', liveUpdate.id));
  const publishedTime = $derived(
    new Intl.DateTimeFormat(locale, { timeStyle: 'short', dateStyle: 'medium' }).format(
      new Date(liveUpdate.publishedAt)
    )
  );
</script>

<article
  class={['live-update-card', liveUpdate.pinned ? 'live-update-card--pinned' : '', extraClass ?? '']
    .filter(Boolean)
    .join(' ')}
  aria-label={dictionary.localText(
    liveUpdate.pinned ? 'content.live_update.pinned_label' : 'content.live_update.label',
    'content'
  )}
>
  <header class="live-update-card__header">
    {#if liveUpdate.pinned}
      <Badge variant="brand" size="sm"
        >{dictionary.localText('content.live_update.pinned', 'content')}</Badge
      >
    {/if}
    <time class="live-update-card__time" datetime={liveUpdate.publishedAt}>
      {publishedTime}
    </time>
  </header>
  <div class="live-update-card__text">
    {text}
  </div>
</article>
