<script lang="ts">
  import { enhance } from '$app/forms';
  import { localText } from '@sveltebuilder/hermes';
  import {
    Button, Field, Label, Input, Select, SelectItem,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  } from '@sveltebuilder/coreui';
  import { ShipmentStatusBadge, TrackingEventList } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="shipment-detail">
  <header class="shipment-detail__header">
    <div class="shipment-detail__header-row">
      <h1 class="shipment-detail__title">Shipment #{data.shipment.id}</h1>
      <ShipmentStatusBadge
        status={data.shipment.status}
        label={localText(`logistic.shipment.status.${data.shipment.status}`, 'logistic')}
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

  <div class="shipment-detail__columns">
    <section class="shipment-detail__section" aria-label="Shipment lines">
      <h2 class="shipment-detail__section-title">Lines</h2>
      {#if data.shipment.lines.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>SKU</TableHeader>
              <TableHeader class="align-right">Quantity</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.shipment.lines as line (line.id)}
              <TableRow>
                <TableCell><span class="shipment-detail__mono">{line.sku}</span></TableCell>
                <TableCell class="align-right">{line.quantity}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="shipment-detail__empty">No lines on this shipment.</p>
      {/if}

      <h2 class="shipment-detail__section-title">Tracking events</h2>
      <TrackingEventList events={data.shipment.trackingEvents} locale={data.locale.code} />
    </section>

    <aside class="shipment-detail__section" aria-label="Shipment management">
      <h2 class="shipment-detail__section-title">Status</h2>
      <form method="POST" action="?/updateStatus" class="shipment-detail__form" use:enhance>
        <Field>
          <Label for="shipment-status">Shipment status</Label>
          <Select id="shipment-status" name="status" required>
            {#each data.statuses as status (status)}
              <SelectItem value={status}>
                {localText(`logistic.shipment.status.${status}`, 'logistic')}
              </SelectItem>
            {/each}
          </Select>
        </Field>
        <div class="shipment-detail__form-actions">
          <Button type="submit" variant="primary" size="sm">Update status</Button>
        </div>
      </form>

      <h2 class="shipment-detail__section-title">Carrier &amp; tracking</h2>
      <form method="POST" action="?/updateTracking" class="shipment-detail__form" use:enhance>
        <Field>
          <Label for="shipment-carrier">Carrier</Label>
          <Input id="shipment-carrier" name="carrier" value={data.shipment.carrier ?? ''} />
        </Field>
        <Field>
          <Label for="shipment-service">Service level</Label>
          <Input id="shipment-service" name="service_level" value={data.shipment.serviceLevel ?? ''} />
        </Field>
        <Field>
          <Label for="shipment-tracking">Tracking number</Label>
          <Input id="shipment-tracking" name="tracking_number" value={data.shipment.trackingNumber ?? ''} />
        </Field>
        <div class="shipment-detail__form-actions">
          <Button type="submit" variant="secondary" size="sm">Save tracking</Button>
        </div>
      </form>

      <h2 class="shipment-detail__section-title">Add tracking event</h2>
      <form method="POST" action="?/addEvent" class="shipment-detail__form" use:enhance>
        <Field>
          <Label for="event-status">Event</Label>
          <Input id="event-status" name="status" placeholder="e.g. Departed facility" required />
        </Field>
        <Field>
          <Label for="event-location">Location (optional)</Label>
          <Input id="event-location" name="event_location" />
        </Field>
        <Field>
          <Label for="event-description">Description (optional)</Label>
          <Input id="event-description" name="description" />
        </Field>
        <div class="shipment-detail__form-actions">
          <Button type="submit" variant="secondary" size="sm">Add event</Button>
        </div>
      </form>
    </aside>
  </div>
</div>

<style>
  .shipment-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 80rem;
    margin-inline: auto;
    width: 100%;
  }

  .shipment-detail__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .shipment-detail__header-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .shipment-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .shipment-detail__meta {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .shipment-detail__mono {
    font-family: var(--font-mono);
  }

  .shipment-detail__columns {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: var(--space-8);
  }

  @media (max-width: 800px) {
    .shipment-detail__columns {
      grid-template-columns: 1fr;
    }
  }

  .shipment-detail__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .shipment-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .shipment-detail__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
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
