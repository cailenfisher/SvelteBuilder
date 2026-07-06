<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Button, DataTable, Dialog, Field, Label, Input } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import { ShipmentStatusBadge } from '@sveltebuilder/logistic';
  import type { Shipment, ShipmentStatus } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let newShipmentOpen = $state(false);
  let page = $state(data.page);

  const statusFilters: Array<{ value: ShipmentStatus | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'created', label: 'Created' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'in_transit', label: 'In transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'exception', label: 'Exception' },
  ];

  const columns: DataTableColumn[] = [
    { key: 'id', label: 'Shipment' },
    { key: 'status', label: 'Status' },
    { key: 'carrier', label: 'Carrier' },
    { key: 'trackingNumber', label: 'Tracking' },
    { key: 'createdAt', label: 'Created' },
  ];

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet shipmentCell(row: Shipment, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/shipment/{row.id}" class="shipment-list__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <ShipmentStatusBadge
      status={row.status}
      label={localText(`logistic.shipment.status.${row.status}`, 'logistic')}
    />
  {:else if column.key === 'carrier'}
    {row.carrier ?? '—'}
  {:else if column.key === 'trackingNumber'}
    {#if row.trackingNumber}
      <span class="shipment-list__mono">{row.trackingNumber}</span>
    {:else}
      —
    {/if}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<div class="shipment-list">
  <header class="shipment-list__header">
    <h1 class="shipment-list__title">Shipments</h1>
    <Button variant="primary" onclick={() => (newShipmentOpen = true)}>New shipment</Button>
  </header>

  <nav class="shipment-list__filters" aria-label="Shipment status filters">
    {#each statusFilters as filter (filter.value)}
      <Button
        href="/admin/logistic/shipment{filter.value ? `?status=${filter.value}` : ''}"
        variant={(data.status ?? '') === filter.value ? 'secondary' : 'ghost'}
        size="sm"
      >
        {filter.label}
      </Button>
    {/each}
  </nav>

  <DataTable
    columns={columns}
    rows={data.shipments}
    rowKey={(row) => row.id}
    cell={shipmentCell}
    bind:page
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => {
      const params = new URLSearchParams();
      if (data.status) params.set('status', data.status);
      if (next > 1) params.set('page', String(next));
      const query = params.toString();
      window.location.href = `/admin/logistic/shipment${query ? `?${query}` : ''}`;
    }}
    emptyLabel="No shipments found."
  />
</div>

<Dialog bind:open={newShipmentOpen} title="New shipment">
  {#snippet children()}
    <form method="POST" action="?/create" class="shipment-new-form">
      <Field>
        <Label for="shipment-carrier">Carrier (optional)</Label>
        <Input id="shipment-carrier" name="carrier" />
      </Field>

      <Field>
        <Label for="shipment-service">Service level (optional)</Label>
        <Input id="shipment-service" name="service_level" />
      </Field>

      <Field>
        <Label for="shipment-sku">SKU</Label>
        <Input id="shipment-sku" name="sku" required />
      </Field>

      <Field>
        <Label for="shipment-quantity">Quantity</Label>
        <Input id="shipment-quantity" name="quantity" type="number" min="1" value="1" required />
      </Field>

      <div class="shipment-new-form__actions">
        <Button variant="ghost" onclick={() => (newShipmentOpen = false)}>Cancel</Button>
        <Button type="submit" variant="primary">Create shipment</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .shipment-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-6);
    max-width: 80rem;
    margin-inline: auto;
    width: 100%;
  }

  .shipment-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .shipment-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .shipment-list__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .shipment-list__link {
    color: var(--color-text-link);
    text-decoration: none;
    font-weight: var(--weight-medium);
  }

  .shipment-list__link:hover {
    text-decoration: underline;
  }

  .shipment-list__mono {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .shipment-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .shipment-new-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
