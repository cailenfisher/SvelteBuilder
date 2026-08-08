<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import {
    Button, Badge, Field, Label, Input, Select, SelectItem,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const supplierName = $derived(
    data.receipt.supplierId !== null
      ? localText('name', 'supplier', data.receipt.supplierId)
      : localText('logistic.inbound_receipt.blind', 'logistic'),
  );
  const statusLabel = $derived(
    localText(`logistic.inbound_receipt.status.${data.receipt.status}`, 'logistic'),
  );

  const statusVariant = $derived(
    data.receipt.status === 'complete'   ? 'success'
    : data.receipt.status === 'partial'  ? 'warning'
    : data.receipt.status === 'cancelled'? 'danger'
    : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  let showAddLine = $state(false);

  function binLocations() {
    return data.locations.filter((l) => l.locationType === 'bin');
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="receipt-detail">
  <header class="receipt-detail__header">
    <div>
      <a href="/admin/logistic/receipt" class="receipt-detail__back">← Inbound receipts</a>
      <div class="receipt-detail__title-row">
        <h1 class="receipt-detail__title">Receipt #{data.receipt.id}</h1>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      <p class="receipt-detail__supplier">{supplierName}</p>
    </div>
  </header>

  <dl class="receipt-detail__meta">
    <div class="receipt-detail__meta-item">
      <dt>Expected</dt>
      <dd>{formatDate(data.receipt.expectedAt)}</dd>
    </div>
    <div class="receipt-detail__meta-item">
      <dt>Received</dt>
      <dd>{formatDate(data.receipt.receivedAt)}</dd>
    </div>
  </dl>

  {#if data.receipt.note}
    <p class="receipt-detail__note">{data.receipt.note}</p>
  {/if}

  <section class="receipt-detail__lines">
    <div class="receipt-detail__lines-header">
      <h2 class="receipt-detail__section-title">Lines</h2>
      {#if data.receipt.status !== 'complete' && data.receipt.status !== 'cancelled'}
        <Button variant="ghost" size="sm" onclick={() => (showAddLine = !showAddLine)}>
          {showAddLine ? 'Cancel' : 'Add line'}
        </Button>
      {/if}
    </div>

    {#if showAddLine}
      <form method="POST" action="?/addLine" class="receipt-detail__add-line-form">
        <Field>
          <Label for="sku">SKU</Label>
          <Input id="sku" name="sku" required placeholder="e.g. WIDGET-001" />
        </Field>
        <Field>
          <Label for="storage-location">Storage location</Label>
          <Select id="storage-location" name="storage_location_id" required>
            {#each binLocations() as loc}
              <SelectItem value={String(loc.id)}>{localText('name', 'storage_location', loc.id)}</SelectItem>
            {/each}
          </Select>
        </Field>
        <Field>
          <Label for="expected-qty">Expected quantity</Label>
          <Input id="expected-qty" name="expected_quantity" type="number" min="1" required />
        </Field>
        <Button type="submit" variant="primary" size="sm">Add</Button>
      </form>
    {/if}

    {#if data.receipt.lines.length > 0}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>SKU</TableHeader>
            <TableHeader>Location</TableHeader>
            <TableHeader>Expected</TableHeader>
            <TableHeader>Received</TableHeader>
            <TableHeader>Discrepancy</TableHeader>
            {#if data.receipt.status !== 'complete' && data.receipt.status !== 'cancelled'}
              <TableHeader><span class="sr-only">Action</span></TableHeader>
            {/if}
          </TableRow>
        </TableHead>
        <TableBody>
          {#each data.receipt.lines as line (line.id)}
            <TableRow>
              <TableCell><code class="receipt-detail__sku">{line.sku}</code></TableCell>
              <TableCell>{localText('name', 'storage_location', line.storageLocationId)}</TableCell>
              <TableCell>{line.expectedQuantity}</TableCell>
              <TableCell>{line.receivedQuantity}</TableCell>
              <TableCell>
                {#if line.discrepancy !== 0}
                  <span class="receipt-detail__discrepancy" class:receipt-detail__discrepancy--negative={line.discrepancy < 0}>
                    {line.discrepancy > 0 ? '+' : ''}{line.discrepancy}
                  </span>
                {:else}
                  —
                {/if}
              </TableCell>
              {#if data.receipt.status !== 'complete' && data.receipt.status !== 'cancelled'}
                <TableCell>
                  <form method="POST" action="?/receiveLine" class="receipt-detail__receive-form">
                    <input type="hidden" name="line_id" value={line.id} />
                    <Input
                      name="received_quantity"
                      type="number"
                      min="0"
                      value={line.receivedQuantity}
                      class="receipt-detail__qty-input"
                    />
                    <Button type="submit" variant="ghost" size="sm">Receive</Button>
                  </form>
                </TableCell>
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {:else}
      <p class="receipt-detail__empty">No lines yet. Add lines to begin receiving.</p>
    {/if}
  </section>
</div>

<style>
  .receipt-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .receipt-detail__back {
    font-size: var(--text-sm);
    color: var(--color-text-link);
    text-decoration: none;
    display: block;
    margin-block-end: var(--space-2);
  }

  .receipt-detail__back:hover { text-decoration: underline; }

  .receipt-detail__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .receipt-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-detail__supplier {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: var(--space-1) 0 0;
  }

  .receipt-detail__meta {
    display: flex;
    gap: var(--space-6);
    flex-wrap: wrap;
    margin: 0;
  }

  .receipt-detail__meta-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .receipt-detail__meta-item dt {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .receipt-detail__meta-item dd {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-detail__note {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    font-style: italic;
  }

  .receipt-detail__lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .receipt-detail__lines-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .receipt-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-detail__add-line-form {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: var(--space-3);
    align-items: end;
    padding: var(--space-4);
    background-color: var(--color-surface-overlay);
    border-radius: var(--radius-md);
  }

  .receipt-detail__sku {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
  }

  .receipt-detail__discrepancy {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-success-text);
  }

  .receipt-detail__discrepancy--negative {
    color: var(--color-warning-text);
  }

  .receipt-detail__receive-form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .receipt-detail__qty-input {
    width: 80px;
  }

  .receipt-detail__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
