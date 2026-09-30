<script lang="ts">
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    DataTable,
    Dialog,
    Field,
    InlineNotification,
    Input,
    Select,
    SelectItem,
    Textarea,
  } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type {
    ScreenFormResult,
    StockLevelRow,
    StockListView,
  } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: StockListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  // The location's name is entity-bound copy, resolved per row rather than carried on it.
  const locationName = (level: StockLevelRow) =>
    scoped.localText('name', 'storage_location', level.storageLocation.id);

  let adjustOpen = $state(false);
  let adjustTarget = $state<StockLevelRow | null>(null);

  function openAdjust(level: StockLevelRow) {
    adjustTarget = level;
    adjustOpen = true;
  }

  // $derived, so the labels follow a locale switch like every other string on the page.
  const columns: DataTableColumn[] = $derived([
    { key: 'sku', label: t('logistic.field.sku') },
    { key: 'location', label: t('logistic.field.location') },
    { key: 'onHand', label: t('logistic.field.on_hand'), align: 'right' },
    { key: 'reserved', label: t('logistic.field.reserved'), align: 'right' },
    { key: 'available', label: t('logistic.field.available'), align: 'right' },
    { key: 'reorderPoint', label: t('logistic.field.reorder_point'), align: 'right' },
    { key: 'actions', label: '' },
  ]);

  const historyLevel = $derived(
    data.historyId !== null ? (data.levels.find((l) => l.id === data.historyId) ?? null) : null
  );

  const formatTimestamp = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso)
    );
</script>

{#snippet stockCell(row: StockLevelRow, column: DataTableColumn)}
  {#if column.key === 'sku'}
    <span class="stock-page__mono">{row.sku}</span>
  {:else if column.key === 'location'}
    {locationName(row)}
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
      <Button variant="ghost" size="sm" onclick={() => openAdjust(row)}>
        {t('logistic.stock.adjust')}
      </Button>
      <Button variant="ghost" size="sm" href="?history={row.id}">
        {t('logistic.stock.history')}
      </Button>
    </span>
  {/if}
{/snippet}

<svelte:head>
  <title>{t('logistic.stock.title')}</title>
</svelte:head>

<div class="stock-page">
  <header class="stock-page__header">
    <h1 class="stock-page__title">{t('logistic.stock.title')}</h1>
    <nav class="stock-page__filters" aria-label={t('logistic.stock.filters')}>
      <Button href="/admin/logistic/stock" variant={data.lowOnly ? 'ghost' : 'secondary'} size="sm">
        {t('logistic.stock.filter_all')}
      </Button>
      <Button href="?filter=low" variant={data.lowOnly ? 'secondary' : 'ghost'} size="sm">
        {t('logistic.stock.filter_low')}
      </Button>
    </nav>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  {#if historyLevel !== null}
    <section class="stock-page__history" aria-label={t('logistic.stock.history')}>
      <div class="stock-page__history-header">
        <h2 class="stock-page__history-title">
          {t('logistic.stock.history')} — <span class="stock-page__mono">{historyLevel.sku}</span>
          · {locationName(historyLevel)}
        </h2>
        <Button href="/admin/logistic/stock" variant="ghost" size="sm">
          {dictionary.localText('action.close')}
        </Button>
      </div>

      {#if data.history.length > 0}
        <ul class="stock-page__history-list">
          {#each data.history as adjustment (adjustment.id)}
            <li class="stock-page__history-item">
              <span class="stock-page__history-delta" class:negative={adjustment.delta < 0}>
                {adjustment.delta > 0 ? '+' : ''}{adjustment.delta}
              </span>
              <span class="stock-page__history-reason">
                {t(`logistic.adjustment_reason.${adjustment.reason}`)}
              </span>
              <!-- Interpolated through MF2 rather than concatenated, so a locale can put
                   the number wherever its grammar needs it. -->
              <span class="stock-page__history-after">
                {scoped.formatText(
                  'logistic.stock.history_after',
                  { count: adjustment.onHandAfter },
                  'logistic'
                )}
              </span>
              <span class="stock-page__history-when">{formatTimestamp(adjustment.createdAt)}</span>
              {#if adjustment.note}
                <span class="stock-page__history-note">{adjustment.note}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="stock-page__empty">{t('logistic.stock.history_empty')}</p>
      {/if}
    </section>
  {/if}

  <DataTable
    {columns}
    rows={data.levels}
    rowKey={(row) => row.id}
    cell={stockCell}
    emptyLabel={data.lowOnly ? t('logistic.stock.empty_low') : t('logistic.stock.empty')}
  />
</div>

<Dialog bind:open={adjustOpen} title={t('logistic.stock.adjust_title')}>
  {#snippet children()}
    {#if adjustTarget}
      <p class="stock-page__dialog-context">
        <span class="stock-page__mono">{adjustTarget.sku}</span>
        · {locationName(adjustTarget)} · {adjustTarget.onHand}
        {t('logistic.field.on_hand')}
      </p>

      <form
        method="POST"
        action="?/adjust"
        class="stock-page__form"
        use:enhance={() =>
          ({ update }) => {
            update();
            adjustOpen = false;
          }}
      >
        <input type="hidden" name="stock_level_id" value={adjustTarget.id} />

        <!-- Field renders the <label for>; the control inherits its id through field
             context, so it is not repeated on the control. -->
        <Field label={t('logistic.stock.adjust_delta')} id="adjust-delta" required>
          <Input name="delta" type="number" required />
        </Field>

        <Field label={t('logistic.field.reason')} id="adjust-reason" required>
          <!-- `required` lives on Field, which renders the label and marks it; Select
               itself takes no such prop. SelectItem is self-labelling. -->
          <Select name="reason">
            {#each data.manualReasons as reason (reason)}
              <SelectItem value={reason} label={t(`logistic.adjustment_reason.${reason}`)} />
            {/each}
          </Select>
        </Field>

        <Field label={t('logistic.field.note')} id="adjust-note">
          <Textarea name="note" rows={2} />
        </Field>

        <div class="stock-page__form-actions">
          <Button variant="ghost" onclick={() => (adjustOpen = false)}>
            {dictionary.localText('action.cancel')}
          </Button>
          <Button type="submit" variant="primary">{t('logistic.stock.adjust_apply')}</Button>
        </div>
      </form>

      <form
        method="POST"
        action="?/setReorderPoint"
        class="stock-page__form stock-page__form--secondary"
        use:enhance={() =>
          ({ update }) => {
            update();
            adjustOpen = false;
          }}
      >
        <input type="hidden" name="stock_level_id" value={adjustTarget.id} />

        <Field label={t('logistic.stock.reorder_point_hint')} id="adjust-reorder">
          <Input
            name="reorder_point"
            type="number"
            min="0"
            value={adjustTarget.reorderPoint ?? ''}
          />
        </Field>

        <div class="stock-page__form-actions">
          <Button type="submit" variant="secondary">{dictionary.localText('action.save')}</Button>
        </div>
      </form>
    {/if}
  {/snippet}
</Dialog>

<style>
  .stock-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .stock-page__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
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
    display: flex;
    gap: var(--space-1);
    justify-content: flex-end;
  }

  .stock-page__history {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .stock-page__history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .stock-page__history-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .stock-page__history-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .stock-page__history-item {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .stock-page__history-delta {
    font-family: var(--font-mono);
    font-weight: var(--weight-semibold);
    min-width: 3rem;
  }

  .stock-page__history-delta.negative {
    color: var(--danger);
  }

  .stock-page__history-when,
  .stock-page__history-note {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  .stock-page__empty {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: 0;
  }

  .stock-page__dialog-context {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: 0 0 var(--space-4);
  }

  .stock-page__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .stock-page__form-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }
</style>
