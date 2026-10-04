<script lang="ts">
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
    TableHeader,
    TableRow,
  } from '@sveltebuilder/coreui';
  import { ShipmentStatusBadge, TrackingEventList } from '@sveltebuilder/logistic';
  import type { ScreenFormResult, ShipmentDetailView } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: ShipmentDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.shipment.one')} #{data.shipment.id}</title>
</svelte:head>

<div class="shipment-detail">
  <header class="shipment-detail__header">
    <a href="/admin/logistic/shipment" class="shipment-detail__back">
      ← {t('logistic.shipment.title')}
    </a>
    <div class="shipment-detail__header-row">
      <h1 class="shipment-detail__title">{t('logistic.shipment.one')} #{data.shipment.id}</h1>
      <ShipmentStatusBadge
        status={data.shipment.status}
        label={t(`logistic.shipment.status.${data.shipment.status}`)}
      />
    </div>
    {#if data.shipment.carrier}
      <p class="shipment-detail__meta">
        {data.shipment.carrier}
        {#if data.shipment.serviceLevel}· {data.shipment.serviceLevel}{/if}
        {#if data.shipment.trackingNumber}
          · <span class="shipment-detail__mono">{data.shipment.trackingNumber}</span>
        {/if}
      </p>
    {/if}
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <div class="shipment-detail__columns">
    <section class="shipment-detail__section" aria-label={t('logistic.shipment.lines')}>
      <h2 class="shipment-detail__section-title">{t('logistic.shipment.lines')}</h2>
      {#if data.shipment.lines.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('logistic.field.sku')}</TableHeader>
              <TableHeader>{t('logistic.shipment.quantity')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.shipment.lines as line (line.id)}
              <TableRow>
                <TableCell><code class="shipment-detail__mono">{line.sku}</code></TableCell>
                <TableCell>{line.quantity}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="shipment-detail__empty">{t('logistic.shipment.lines_empty')}</p>
      {/if}

      <h2 class="shipment-detail__section-title">{t('logistic.shipment.tracking_events')}</h2>
      <!-- Camp 1 component: events in, markup out, no dictionary of its own. -->
      <TrackingEventList events={data.shipment.trackingEvents} locale={data.localeCode} />
    </section>

    <section class="shipment-detail__section" aria-label={t('logistic.shipment.status_label')}>
      <h2 class="shipment-detail__section-title">{t('logistic.shipment.status_label')}</h2>
      <!-- use:enhance so these three side-by-side forms submit without losing the other
           two's unsaved input to a full navigation. -->
      <form method="POST" action="?/updateStatus" class="shipment-detail__form" use:enhance>
        <Field label={t('logistic.shipment.status_label')} id="shipment-status" required>
          <Select name="status" value={data.shipment.status}>
            {#each data.statuses as status (status)}
              <SelectItem value={status} label={t(`logistic.shipment.status.${status}`)} />
            {/each}
          </Select>
        </Field>
        <div class="shipment-detail__form-actions">
          <Button type="submit" variant="primary" size="sm">
            {t('logistic.shipment.status_update')}
          </Button>
        </div>
      </form>

      <h2 class="shipment-detail__section-title">{t('logistic.shipment.carrier_tracking')}</h2>
      <form method="POST" action="?/updateTracking" class="shipment-detail__form" use:enhance>
        <Field label={t('logistic.field.carrier')} id="shipment-carrier">
          <Input name="carrier" value={data.shipment.carrier ?? ''} />
        </Field>
        <Field label={t('logistic.shipment.service_level')} id="shipment-service">
          <Input name="service_level" value={data.shipment.serviceLevel ?? ''} />
        </Field>
        <Field label={t('logistic.field.tracking_number')} id="shipment-tracking">
          <Input name="tracking_number" value={data.shipment.trackingNumber ?? ''} />
        </Field>
        <div class="shipment-detail__form-actions">
          <Button type="submit" variant="secondary" size="sm">
            {dictionary.localText('action.save')}
          </Button>
        </div>
      </form>

      <h2 class="shipment-detail__section-title">{t('logistic.shipment.event_add')}</h2>
      <form method="POST" action="?/addEvent" class="shipment-detail__form" use:enhance>
        <!-- Free text, not the shipment enum: this records what the carrier called the
             scan, which no enum of ours can enumerate. -->
        <Field label={t('logistic.shipment.event')} id="event-status" required>
          <Input name="status" required />
        </Field>
        <Field label={t('logistic.field.location')} id="event-location">
          <Input name="event_location" />
        </Field>
        <Field label={t('logistic.shipment.event_description')} id="event-description">
          <Input name="description" />
        </Field>
        <div class="shipment-detail__form-actions">
          <Button type="submit" variant="secondary" size="sm">
            {dictionary.localText('action.add')}
          </Button>
        </div>
      </form>
    </section>
  </div>
</div>

<style>
  .shipment-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .shipment-detail__back {
    color: var(--text-soft);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .shipment-detail__header-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
  }

  .shipment-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .shipment-detail__meta,
  .shipment-detail__empty {
    color: var(--text-soft);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .shipment-detail__columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: var(--space-8);
    align-items: start;
  }

  .shipment-detail__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .shipment-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: var(--space-4) 0 0;
  }

  .shipment-detail__mono {
    font-family: var(--font-mono);
  }

  .shipment-detail__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .shipment-detail__form-actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
