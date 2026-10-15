<!-- A shipment's tracking events as a timeline. Each event's status and description are the
     carrier's own operational strings, shown as received and not translated; only the list's
     own copy (scope `logistic`) comes from the dictionary. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Timeline, TimelineItem } from '@sveltebuilder/coreui';
  import type { TrackingEvent } from '../schema/index.js';

  type Props = {
    events: TrackingEvent[];
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { events, locale, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  function formatTimestamp(iso: string): string {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  }
</script>

<Timeline class={extraClass}>
  {#each events as event, index (event.id)}
    <TimelineItem
      timestamp={formatTimestamp(event.occurredAt)}
      label={event.status}
      current={index === events.length - 1}
    >
      {#if event.description}
        <p class="tracking-event-list__description">{event.description}</p>
      {/if}
      {#if event.eventLocation}
        <p class="tracking-event-list__location">{event.eventLocation}</p>
      {/if}
    </TimelineItem>
  {:else}
    <li class="tracking-event-list__empty">
      {dictionary.localText('logistic.tracking_event.empty', 'logistic')}
    </li>
  {/each}
</Timeline>
