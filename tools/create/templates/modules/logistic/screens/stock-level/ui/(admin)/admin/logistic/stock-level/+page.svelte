<script lang="ts">
  import './stock-level-list-screen.css';
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
  import type { StockLevelRow, StockLevelListView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: StockLevelListView; form?: ScreenFormResult } = $props();

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
    { key: 'location', label: t('logistic.field.storage_location') },
    { key: 'onHand', label: t('logistic.field.on_hand'), align: 'end' },
    { key: 'reserved', label: t('logistic.field.reserved'), align: 'end' },
    { key: 'available', label: t('logistic.field.available'), align: 'end' },
    { key: 'reorderPoint', label: t('logistic.field.reorder_point'), align: 'end' },
    { key: 'actions', label: '' },
  ]);

  const historyLevel = $derived(
    data.historyStockLevelId !== null ? (data.stockLevels.find((l) => l.id === data.historyStockLevelId) ?? null) : null
  );

  const formatTimestamp = (iso: string) =>
    new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso)
    );
</script>

{#snippet stockCell(row: StockLevelRow, column: DataTableColumn)}
  {#if column.key === 'sku'}
    <span class="stock-level-list-screen__mono">{row.sku}</span>
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
    <span class="stock-level-list-screen__actions">
      <Button variant="ghost" size="sm" onclick={() => openAdjust(row)}>
        {t('logistic.stock_level.adjust')}
      </Button>
      <Button variant="ghost" size="sm" href="?history={row.id}">
        {t('logistic.stock_level.history')}
      </Button>
    </span>
  {/if}
{/snippet}

<svelte:head>
  <title>{t('logistic.stock_level.title')}</title>
</svelte:head>

<div class="stock-level-list-screen">
  <header class="stock-level-list-screen__header">
    <h1 class="stock-level-list-screen__title">{t('logistic.stock_level.title')}</h1>
    <nav class="stock-level-list-screen__filters" aria-label={t('logistic.stock_level.filters')}>
      <Button href="/admin/logistic/stock-level" variant={data.lowOnly ? 'ghost' : 'secondary'} size="sm">
        {t('logistic.stock_level.filter_all')}
      </Button>
      <Button href="?filter=low" variant={data.lowOnly ? 'secondary' : 'ghost'} size="sm">
        {t('logistic.stock_level.filter_low')}
      </Button>
    </nav>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  {#if historyLevel !== null}
    <section class="stock-level-list-screen__history" aria-label={t('logistic.stock_level.history')}>
      <div class="stock-level-list-screen__history-header">
        <h2 class="stock-level-list-screen__history-title">
          {t('logistic.stock_level.history')} — <span class="stock-level-list-screen__mono">{historyLevel.sku}</span>
          · {locationName(historyLevel)}
        </h2>
        <Button href="/admin/logistic/stock-level" variant="ghost" size="sm">
          {dictionary.localText('action.close')}
        </Button>
      </div>

      {#if data.stockAdjustments.length > 0}
        <ul class="stock-level-list-screen__history-list">
          {#each data.stockAdjustments as adjustment (adjustment.id)}
            <li class="stock-level-list-screen__history-item">
              <span class="stock-level-list-screen__history-delta" class:negative={adjustment.delta < 0}>
                {adjustment.delta > 0 ? '+' : ''}{adjustment.delta}
              </span>
              <span class="stock-level-list-screen__history-reason">
                {t(`logistic.stock_adjustment_reason.${adjustment.reason}`)}
              </span>
              <!-- Interpolated through MF2 rather than concatenated, so a locale can put
                   the number wherever its grammar needs it. -->
              <span class="stock-level-list-screen__history-after">
                {scoped.formatText(
                  'logistic.stock_level.history_after',
                  { count: adjustment.onHandAfter },
                  'logistic'
                )}
              </span>
              <span class="stock-level-list-screen__history-when">{formatTimestamp(adjustment.createdAt)}</span>
              {#if adjustment.note}
                <span class="stock-level-list-screen__history-note">{adjustment.note}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="stock-level-list-screen__empty">{t('logistic.stock_level.history_empty')}</p>
      {/if}
    </section>
  {/if}

  <DataTable
    {columns}
    rows={data.stockLevels}
    rowKey={(row) => row.id}
    cell={stockCell}
    labels={{
      empty: data.lowOnly ? t('logistic.stock_level.empty_low') : t('logistic.stock_level.empty'),
      pagination: dictionary.localText('navigation.pagination'),
      previousPage: dictionary.localText('pagination.previous'),
      nextPage: dictionary.localText('pagination.next'),
    }}
  />
</div>

<Dialog bind:open={adjustOpen} title={t('logistic.stock_level.adjust_title')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    {#if adjustTarget}
      <p class="stock-level-list-screen__dialog-context">
        <span class="stock-level-list-screen__mono">{adjustTarget.sku}</span>
        · {locationName(adjustTarget)} · {adjustTarget.onHand}
        {t('logistic.field.on_hand')}
      </p>

      <form
        method="POST"
        action="?/adjust"
        class="stock-level-list-screen__form"
        use:enhance={() =>
          ({ update }) => {
            update();
            adjustOpen = false;
          }}
      >
        <input type="hidden" name="stock_level_id" value={adjustTarget.id} />

        <!-- Field renders the <label for>; the control inherits its id through field
             context, so it is not repeated on the control. -->
        <Field label={t('logistic.stock_level.adjust_delta')} id="adjust-delta" required>
          <Input name="delta" type="number" required />
        </Field>

        <Field label={t('logistic.field.reason')} id="adjust-reason" required>
          <!-- `required` lives on Field, which renders the label and marks it; Select
               itself takes no such prop. SelectItem is self-labelling. -->
          <Select name="reason">
            {#each data.manualReasons as reason (reason)}
              <SelectItem value={reason} label={t(`logistic.stock_adjustment_reason.${reason}`)} />
            {/each}
          </Select>
        </Field>

        <Field label={t('logistic.field.note')} id="adjust-note">
          <Textarea name="note" rows={2} />
        </Field>

        <div class="stock-level-list-screen__form-actions">
          <Button variant="ghost" onclick={() => (adjustOpen = false)}>
            {dictionary.localText('action.cancel')}
          </Button>
          <Button type="submit" variant="primary">{t('logistic.stock_level.adjust_apply')}</Button>
        </div>
      </form>

      <form
        method="POST"
        action="?/setReorderPoint"
        class="stock-level-list-screen__form stock-level-list-screen__form--secondary"
        use:enhance={() =>
          ({ update }) => {
            update();
            adjustOpen = false;
          }}
      >
        <input type="hidden" name="stock_level_id" value={adjustTarget.id} />

        <Field label={t('logistic.stock_level.reorder_point_hint')} id="adjust-reorder">
          <Input
            name="reorder_point"
            type="number"
            min="0"
            value={adjustTarget.reorderPoint ?? ''}
          />
        </Field>

        <div class="stock-level-list-screen__form-actions">
          <Button type="submit" variant="secondary">{dictionary.localText('action.save')}</Button>
        </div>
      </form>
    {/if}
  {/snippet}
</Dialog>
