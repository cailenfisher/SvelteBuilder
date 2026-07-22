<script lang="ts">
  import { enhance } from '$app/forms';
  import { localText } from '@sveltebuilder/hermes';
  import {
    Button, DataTable, Dialog, Field, Label, Input, Select, SelectItem, Textarea, Badge,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { StockLevelWithLocation } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let adjustOpen = $state(false);
  let adjustTarget = $state<StockLevelWithLocation | null>(null);

  function openAdjust(level: StockLevelWithLocation) {
    adjustTarget = level;
    adjustOpen = true;
  }

  const columns: DataTableColumn[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'location', label: 'Location' },
    { key: 'onHand', label: 'On hand', align: 'right' },
    { key: 'reserved', label: 'Reserved', align: 'right' },
    { key: 'available', label: 'Available', align: 'right' },
    { key: 'reorderPoint', label: 'Reorder point', align: 'right' },
    { key: 'actions', label: '' },
  ];

  const historyLevel = $derived(
    data.historyId !== null ? (data.levels.find((l) => l.id === data.historyId) ?? null) : null,
  );

  function formatTimestamp(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  }
</script>

{#snippet stockCell(row: StockLevelWithLocation, column: DataTableColumn)}
  {#if column.key === 'sku'}
    <span class="stock-page__mono">{row.sku}</span>
  {:else if column.key === 'location'}
    {row.storageLocation.name}
  {:else if column.key === 'onHand'}
    {row.onHand}
  {:else if column.key === 'reserved'}
    {row.reserved}
  {:else if column.key === 'available'}
    {#if row.reorderPoint !== null && row.available <= row.reorderPoint}
      <Badge variant="warning" size="sm">{row.available}</Badge>
    {:else}
      {row.available}
    {/if}
  {:else if column.key === 'reorderPoint'}
    {row.reorderPoint ?? '—'}
  {:else if column.key === 'actions'}
    <span class="stock-page__actions">
      <Button variant="ghost" size="sm" onclick={() => openAdjust(row)}>Adjust</Button>
      <Button variant="ghost" size="sm" href="?history={row.id}">History</Button>
    </span>
  {/if}
{/snippet}

<div class="stock-page">
  <header class="stock-page__header">
    <h1 class="stock-page__title">Stock</h1>
    <nav class="stock-page__filters" aria-label="Stock filters">
      <Button href="/admin/logistic/stock" variant={data.lowOnly ? 'ghost' : 'secondary'} size="sm">
        All
      </Button>
      <Button href="?filter=low" variant={data.lowOnly ? 'secondary' : 'ghost'} size="sm">
        Low stock
      </Button>
    </nav>
  </header>

  {#if historyLevel !== null}
    <section class="stock-page__history" aria-label="Adjustment history">
      <div class="stock-page__history-header">
        <h2 class="stock-page__history-title">
          History — <span class="stock-page__mono">{historyLevel.sku}</span>
          at {historyLevel.storageLocation.name}
        </h2>
        <Button href="/admin/logistic/stock" variant="ghost" size="sm">Close</Button>
      </div>

      {#if data.history.length > 0}
        <ul class="stock-page__history-list">
          {#each data.history as adjustment (adjustment.id)}
            <li class="stock-page__history-item">
              <span class="stock-page__history-delta" class:negative={adjustment.delta < 0}>
                {adjustment.delta > 0 ? '+' : ''}{adjustment.delta}
              </span>
              <span class="stock-page__history-reason">
                {localText(`logistic.adjustment_reason.${adjustment.reason}`, 'logistic')}
              </span>
              <span class="stock-page__history-after">
                → {adjustment.onHandAfter} on hand
              </span>
              <span class="stock-page__history-when">{formatTimestamp(adjustment.createdAt)}</span>
              {#if adjustment.note}
                <span class="stock-page__history-note">{adjustment.note}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="stock-page__empty">No adjustments recorded for this stock level.</p>
      {/if}
    </section>
  {/if}

  <DataTable
    columns={columns}
    rows={data.levels}
    rowKey={(row) => row.id}
    cell={stockCell}
    emptyLabel={data.lowOnly ? 'No items below their reorder point.' : 'No stock levels yet.'}
  />
</div>

<Dialog bind:open={adjustOpen} title="Adjust stock">
  {#snippet children()}
    {#if adjustTarget}
      <p class="stock-page__dialog-context">
        <span class="stock-page__mono">{adjustTarget.sku}</span>
        at {adjustTarget.storageLocation.name} — {adjustTarget.onHand} on hand
      </p>

      <form
        method="POST"
        action="?/adjust"
        class="stock-page__form"
        use:enhance={() => {
          return ({ update }) => {
            update();
            adjustOpen = false;
          };
        }}
      >
        <input type="hidden" name="stock_level_id" value={adjustTarget.id} />

        <Field>
          <Label for="adjust-delta">Change (negative to remove)</Label>
          <Input id="adjust-delta" name="delta" type="number" required />
        </Field>

        <Field>
          <Label for="adjust-reason">Reason</Label>
          <Select id="adjust-reason" name="reason" required>
            {#each data.manualReasons as reason (reason)}
              <SelectItem value={reason}>
                {localText(`logistic.adjustment_reason.${reason}`, 'logistic')}
              </SelectItem>
            {/each}
          </Select>
        </Field>

        <Field>
          <Label for="adjust-note">Note (optional)</Label>
          <Textarea id="adjust-note" name="note" rows={2} />
        </Field>

        <div class="stock-page__form-actions">
          <Button variant="ghost" onclick={() => (adjustOpen = false)}>Cancel</Button>
          <Button type="submit" variant="primary">Apply adjustment</Button>
        </div>
      </form>

      <form
        method="POST"
        action="?/setReorderPoint"
        class="stock-page__form stock-page__form--secondary"
        use:enhance={() => {
          return ({ update }) => {
            update();
            adjustOpen = false;
          };
        }}
      >
        <input type="hidden" name="stock_level_id" value={adjustTarget.id} />

        <Field>
          <Label for="adjust-reorder">Reorder point (blank to disable alerts)</Label>
          <Input
            id="adjust-reorder"
            name="reorder_point"
            type="number"
            min="0"
            value={adjustTarget.reorderPoint ?? ''}
          />
        </Field>

        <div class="stock-page__form-actions">
          <Button type="submit" variant="secondary">Save reorder point</Button>
        </div>
      </form>
    {/if}
  {/snippet}
</Dialog>

<style>
  .stock-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-6);
    max-width: 80rem;
    margin-inline: auto;
    width: 100%;
  }

  .stock-page__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .stock-page__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .stock-page__filters {
    display: flex;
    gap: var(--space-2);
  }

  .stock-page__mono {
    font-family: var(--font-mono);
  }

  .stock-page__actions {
    display: inline-flex;
    gap: var(--space-1);
  }

  .stock-page__history {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background-color: var(--color-surface-overlay);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
  }

  .stock-page__history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .stock-page__history-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .stock-page__history-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .stock-page__history-item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    padding: var(--space-2) 0;
    border-block-end: 1px solid var(--color-border-default);
  }

  .stock-page__history-delta {
    font-family: var(--font-mono);
    font-weight: var(--weight-semibold);
    color: var(--color-success-text);
  }

  .stock-page__history-delta.negative {
    color: var(--color-danger-text);
  }

  .stock-page__history-reason {
    color: var(--color-text-primary);
  }

  .stock-page__history-note {
    flex-basis: 100%;
    font-size: var(--text-xs);
  }

  .stock-page__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .stock-page__dialog-context {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-4);
  }

  .stock-page__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .stock-page__form--secondary {
    margin-block-start: var(--space-5);
    padding-block-start: var(--space-4);
    border-block-start: 1px solid var(--color-border-default);
  }

  .stock-page__form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
