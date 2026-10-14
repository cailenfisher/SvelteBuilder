<script lang="ts">
  import './shipment-detail-screen.css';
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Button,
    Field,
    InlineNotification,
    Input,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import { ShipmentStatusBadge, TrackingEventList } from '@sveltebuilder/logistic';
  import type { ShipmentDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: ShipmentDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.shipment.one')} #{data.shipment.id}</title>
</svelte:head>

<div class="shipment-detail-screen">
  <header class="shipment-detail-screen__header">
    <a href="/admin/logistic/shipment" class="shipment-detail-screen__back">
      ← {t('logistic.shipment.title')}
    </a>
    <div class="shipment-detail-screen__header-row">
      <h1 class="shipment-detail-screen__title">{t('logistic.shipment.one')} #{data.shipment.id}</h1>
      <ShipmentStatusBadge
        status={data.shipment.status}
        label={t(`logistic.shipment.status.${data.shipment.status}`)}
      />
    </div>
    {#if data.shipment.carrier}
      <p class="shipment-detail-screen__meta">
        {data.shipment.carrier}
        {#if data.shipment.serviceLevel}· {data.shipment.serviceLevel}{/if}
        {#if data.shipment.trackingNumber}
          · <span class="shipment-detail-screen__mono">{data.shipment.trackingNumber}</span>
        {/if}
      </p>
    {/if}
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <div class="shipment-detail-screen__columns">
    <section class="shipment-detail-screen__section" aria-label={t('logistic.shipment.lines')}>
      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.lines')}</h2>
      {#if data.shipment.lines.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t('logistic.field.sku')}</TableHeaderCell>
              <TableHeaderCell>{t('logistic.shipment.quantity')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.shipment.lines as line (line.id)}
              <TableRow>
                <TableCell><code class="shipment-detail-screen__mono">{line.sku}</code></TableCell>
                <TableCell>{line.quantity}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="shipment-detail-screen__empty">{t('logistic.shipment.lines_empty')}</p>
      {/if}

      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.tracking_events')}</h2>
      <!-- Camp 1 component: events in, markup out, no dictionary of its own. -->
      <TrackingEventList events={data.shipment.trackingEvents} locale={data.localeCode} />
    </section>

    <section class="shipment-detail-screen__section" aria-label={t('logistic.shipment.status_label')}>
      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.status_label')}</h2>
      <!-- use:enhance so these three side-by-side forms submit without losing the other
           two's unsaved input to a full navigation. -->
      <form method="POST" action="?/updateStatus" class="shipment-detail-screen__form" use:enhance>
        <Field label={t('logistic.shipment.status_label')} id="shipment-status" required>
          <Select name="status" value={data.shipment.status}>
            {#each data.statuses as status (status)}
              <SelectItem value={status} label={t(`logistic.shipment.status.${status}`)} />
            {/each}
          </Select>
        </Field>
        <div class="shipment-detail-screen__form-actions">
          <Button type="submit" variant="primary" size="sm">
            {t('logistic.shipment.status_update')}
          </Button>
        </div>
      </form>

      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.carrier_tracking')}</h2>
      <form method="POST" action="?/updateTracking" class="shipment-detail-screen__form" use:enhance>
        <Field label={t('logistic.field.carrier')} id="shipment-carrier">
          <Input name="carrier" value={data.shipment.carrier ?? ''} />
        </Field>
        <Field label={t('logistic.shipment.service_level')} id="shipment-service">
          <Input name="service_level" value={data.shipment.serviceLevel ?? ''} />
        </Field>
        <Field label={t('logistic.field.tracking_number')} id="shipment-tracking">
          <Input name="tracking_number" value={data.shipment.trackingNumber ?? ''} />
        </Field>
        <div class="shipment-detail-screen__form-actions">
          <Button type="submit" variant="secondary" size="sm">
            {dictionary.localText('action.save')}
          </Button>
        </div>
      </form>

      <h2 class="shipment-detail-screen__section-title">{t('logistic.shipment.event_add')}</h2>
      <form method="POST" action="?/addTrackingEvent" class="shipment-detail-screen__form" use:enhance>
        <!-- Free text, not the shipment enum: this records what the carrier called the
             scan, which no enum of ours can enumerate. -->
        <Field label={t('logistic.shipment.event')} id="event-status" required>
          <Input name="status" required />
        </Field>
        <Field label={t('logistic.field.storage_location')} id="event-location">
          <Input name="event_location" />
        </Field>
        <Field label={t('logistic.shipment.event_description')} id="event-description">
          <Input name="description" />
        </Field>
        <div class="shipment-detail-screen__form-actions">
          <Button type="submit" variant="secondary" size="sm">
            {dictionary.localText('action.add')}
          </Button>
        </div>
      </form>
    </section>
  </div>
</div>
