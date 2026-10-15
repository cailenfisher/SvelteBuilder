<script lang="ts">
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

  let { data, form }: { data: ShipmentDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.shipment.one')} #{data.shipment.id}</title>
</svelte:head>

<div class="shipment-detail-screen">
  <ShipmentDetailHeader shipment={data.shipment} dictionary={scoped} />

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <div class="shipment-detail-screen__columns">
    <section class="shipment-detail-screen__section" aria-label={t('logistic.shipment.lines')}>
      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.lines')}</h2>
      <ShipmentLineTable shipmentLines={data.shipment.lines} dictionary={scoped} />

      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.tracking_events')}</h2>
      <TrackingEventList events={data.shipment.trackingEvents} locale={data.localeCode} />
    </section>

    <section class="shipment-detail-screen__section" aria-label={t('logistic.shipment.status_label')}>
      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.status_label')}</h2>
      <ShipmentStatusForm shipment={data.shipment} statuses={data.statuses} dictionary={scoped} />

      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.carrier_tracking')}</h2>
      <ShipmentTrackingForm shipment={data.shipment} dictionary={scoped} />

      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.event_add')}</h2>
      <TrackingEventAddForm dictionary={scoped} />
    </section>
  </div>
</div>
