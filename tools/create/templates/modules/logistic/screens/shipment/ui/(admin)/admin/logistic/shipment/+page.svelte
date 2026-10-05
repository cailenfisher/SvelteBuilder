<script lang="ts">
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Button,
    DataTable,
    Dialog,
    Field,
    InlineNotification,
    Input,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import { ShipmentStatusBadge } from '@sveltebuilder/logistic';
  import type { ShipmentStatus } from '@sveltebuilder/logistic';
  import type {
    ScreenFormResult,
    ShipmentListView,
    ShipmentRow,
  } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: ShipmentListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  let newShipmentOpen = $state(false);

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: t('logistic.shipment.one') },
    { key: 'status', label: t('logistic.shipment.status_label') },
    { key: 'carrier', label: t('logistic.field.carrier') },
    { key: 'trackingNumber', label: t('logistic.field.tracking_number') },
    { key: 'lineCount', label: t('logistic.shipment.lines'), align: 'right' },
    { key: 'createdAt', label: t('logistic.shipment.created_at') },
  ]);

  const href = (status: ShipmentStatus | null, page = 1) => {
    const params = new URLSearchParams();
    if (status !== null) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/logistic/shipment${query ? `?${query}` : ''}`;
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet shipmentCell(row: ShipmentRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/shipment/{row.id}" class="shipment-list__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <!-- Camp 1 component: it takes the label as a plain string and imports no dictionary. -->
    <ShipmentStatusBadge status={row.status} label={t(`logistic.shipment.status.${row.status}`)} />
  {:else if column.key === 'carrier'}
    {row.carrier ?? '—'}
  {:else if column.key === 'trackingNumber'}
    {#if row.trackingNumber}
      <span class="shipment-list__mono">{row.trackingNumber}</span>
    {:else}
      —
    {/if}
  {:else if column.key === 'lineCount'}
    {row.lineCount}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<svelte:head>
  <title>{t('logistic.shipment.title')}</title>
</svelte:head>

<div class="shipment-list">
  <header class="shipment-list__header">
    <h1 class="shipment-list__title">{t('logistic.shipment.title')}</h1>
    <Button variant="primary" onclick={() => (newShipmentOpen = true)}>
      {t('logistic.shipment.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <nav class="shipment-list__filters" aria-label={t('logistic.shipment.filter_status')}>
    <Button
      href={href(null)}
      variant={data.status === null ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={data.status === null ? 'page' : undefined}
    >
      {t('logistic.shipment.filter_all')}
    </Button>
    {#each data.statuses as status (status)}
      <Button
        href={href(status)}
        variant={data.status === status ? 'secondary' : 'ghost'}
        size="sm"
        aria-current={data.status === status ? 'page' : undefined}
      >
        {t(`logistic.shipment.status.${status}`)}
      </Button>
    {/each}
  </nav>

  <DataTable
    {columns}
    rows={data.shipments}
    rowKey={(row) => row.id}
    cell={shipmentCell}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    emptyLabel={t('logistic.shipment.empty')}
  />
</div>

<Dialog bind:open={newShipmentOpen} title={t('logistic.shipment.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <form method="POST" action="?/create" class="shipment-new-form">
      <!-- Field renders the <label for>; the control inherits its id from field context. -->
      <Field label={t('logistic.field.carrier')} id="shipment-carrier">
        <Input name="carrier" />
      </Field>

      <Field label={t('logistic.shipment.service_level')} id="shipment-service">
        <Input name="service_level" />
      </Field>

      <Field label={t('logistic.field.sku')} id="shipment-sku" required>
        <Input name="sku" required />
      </Field>

      <Field label={t('logistic.shipment.quantity')} id="shipment-quantity" required>
        <Input name="quantity" type="number" min="1" value="1" required />
      </Field>

      <div class="shipment-new-form__actions">
        <Button variant="ghost" onclick={() => (newShipmentOpen = false)}>
          {dictionary.localText('action.cancel')}
        </Button>
        <Button type="submit" variant="primary">{t('logistic.shipment.create')}</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .shipment-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .shipment-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .shipment-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .shipment-list__filters {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .shipment-list__link {
    color: var(--text);
    font-weight: var(--weight-medium);
  }

  .shipment-list__mono {
    font-family: var(--font-mono);
  }

  .shipment-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .shipment-new-form__actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }
</style>
