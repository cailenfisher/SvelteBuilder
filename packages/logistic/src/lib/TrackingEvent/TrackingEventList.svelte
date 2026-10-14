<!-- Camp 1: i18n-agnostic. Tracking event descriptions are operational strings
     from the carrier — not editorial copy, not localized. -->
<script lang="ts">
  import { Timeline, TimelineItem } from '@sveltebuilder/coreui';
  import type { TrackingEvent } from '../schema/index.js';

  type Props = {
    events: TrackingEvent[];
    locale?: string;
    class?: string | undefined;
  };

  let { events, locale = 'en', class: extraClass }: Props = $props();

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
    <li class="tracking-event-list__empty">No tracking events yet.</li>
  {/each}
</Timeline>
