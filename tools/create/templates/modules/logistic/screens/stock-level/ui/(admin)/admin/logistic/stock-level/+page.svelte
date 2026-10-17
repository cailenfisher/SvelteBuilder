<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import './stock-level-list-screen.css';
  import { createDictionary } from 'diglossia';
  import { FilterLinkList, InlineNotification } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { StockLevelRow, StockLevelListView } from '@sveltebuilder/logistic/views';
  import StockAdjustmentModal from './StockAdjustmentModal.svelte';
  import StockAdjustmentPanel from './StockAdjustmentPanel.svelte';
  import StockLevelTable from './StockLevelTable.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: StockLevelListView; form?: ScreenFormResult } = $props();

  const globalDictionary = getDictionary();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  let adjustOpen = $state(false);
  let adjustTarget = $state<StockLevelRow | null>(null);

  const historyLevel = $derived(
    data.historyStockLevelId !== null
      ? (data.stockLevels.find((level) => level.id === data.historyStockLevelId) ?? null)
      : null
  );
</script>

<svelte:head>
  <title>{localText('logistic.stock_level.title')}</title>
</svelte:head>

<div class="stock-level-list-screen">
  <header class="stock-level-list-screen__header">
    <h1 class="stock-level-list-screen__title">{localText('logistic.stock_level.title')}</h1>
    <FilterLinkList
      label={localText('logistic.stock_level.filters')}
      links={[
        { href: '/admin/logistic/stock-level', label: localText('logistic.stock_level.filter_all'), current: !data.lowOnly },
        { href: '?filter=low', label: localText('logistic.stock_level.filter_low'), current: data.lowOnly },
      ]}
    />
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, globalDictionary)} detail={form.error.detail} />
  {/if}

  {#if historyLevel !== null}
    <StockAdjustmentPanel
      stockLevel={historyLevel}
      stockAdjustments={data.stockAdjustments}
      localeCode={data.localeCode}
      dictionary={scoped}
    />
  {/if}

  <StockLevelTable
    stockLevels={data.stockLevels}
    lowOnly={data.lowOnly}
    onAdjust={(stockLevel) => {
      adjustTarget = stockLevel;
      adjustOpen = true;
    }}
    dictionary={scoped}
  />
</div>

<StockAdjustmentModal
  open={adjustOpen}
  onOpenChange={(open) => (adjustOpen = open)}
  stockLevel={adjustTarget}
  manualReasons={data.manualReasons}
  dictionary={scoped}
/>
