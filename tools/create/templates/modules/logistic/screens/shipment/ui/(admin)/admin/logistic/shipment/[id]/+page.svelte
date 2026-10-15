<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import './shipment-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import { ShipmentLineTable, TrackingEventList } from '@sveltebuilder/logistic';
  import type { ShipmentDetailView } from '@sveltebuilder/logistic/views';
  import ShipmentDetailHeader from './ShipmentDetailHeader.svelte';
  import ShipmentStatusForm from './ShipmentStatusForm.svelte';
  import ShipmentTrackingForm from './ShipmentTrackingForm.svelte';
  import TrackingEventAddForm from './TrackingEventAddForm.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: ShipmentDetailView; form?: ScreenFormResult } = $props();

  const globalDictionary = getDictionary();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{localText('logistic.shipment.one')} #{data.shipment.id}</title>
</svelte:head>

<div class="shipment-detail-screen">
  <ShipmentDetailHeader shipment={data.shipment} dictionary={scoped} />

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, globalDictionary)} detail={form.error.detail} />
  {/if}

  <div class="shipment-detail-screen__columns">
    <section class="shipment-detail-screen__section" aria-label={localText('logistic.shipment.lines')}>
      <h2 class="shipment-detail-screen__section-title">{localText('logistic.shipment.lines')}</h2>
      <ShipmentLineTable shipmentLines={data.shipment.lines} dictionary={scoped} />

      <h2 class="shipment-detail-screen__section-title">{localText('logistic.shipment.tracking_events')}</h2>
      <TrackingEventList events={data.shipment.trackingEvents} locale={data.localeCode} dictionary={scoped} />
    </section>

    <section class="shipment-detail-screen__section" aria-label={localText('logistic.shipment.status_label')}>
      <h2 class="shipment-detail-screen__section-title">{localText('logistic.shipment.status_label')}</h2>
      <ShipmentStatusForm shipment={data.shipment} statuses={data.statuses} dictionary={scoped} />

      <h2 class="shipment-detail-screen__section-title">{localText('logistic.shipment.carrier_tracking')}</h2>
      <ShipmentTrackingForm shipment={data.shipment} dictionary={scoped} />

      <h2 class="shipment-detail-screen__section-title">{localText('logistic.shipment.event_add')}</h2>
      <TrackingEventAddForm dictionary={scoped} />
    </section>
  </div>
</div>
