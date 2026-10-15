<script lang="ts">
  import './cycle-count-warehouse-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import type { CycleCountWarehouseDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import CycleCountLineList from './CycleCountLineList.svelte';

  let { data, form }: { data: CycleCountWarehouseDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const count = $derived(data.cycleCount);
  const counted = $derived(count.lines.filter((line) => line.countedQuantity !== null).length);
</script>

<svelte:head>
  <title>{t('logistic.cycle_count.one')} #{count.id}</title>
</svelte:head>

<div class="cycle-count-warehouse-detail-screen">
  <header class="cycle-count-warehouse-detail-screen__header">
    <a href="/warehouse/cycle-count" class="cycle-count-warehouse-detail-screen__back">← {t('logistic.warehouse.cycle_count.title')}</a>
    <h1 class="cycle-count-warehouse-detail-screen__title">{t('logistic.cycle_count.one')} #{count.id}</h1>
    <p class="cycle-count-warehouse-detail-screen__meta">
      {scoped.formatText(
        'logistic.cycle_count.progress_value',
        { counted, total: count.lines.length },
        'logistic'
      )}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <CycleCountLineList cycleCountLines={count.lines} dictionary={scoped} />

  <p class="cycle-count-warehouse-detail-screen__note">{t('logistic.warehouse.cycle_count.approval_note')}</p>
</div>
