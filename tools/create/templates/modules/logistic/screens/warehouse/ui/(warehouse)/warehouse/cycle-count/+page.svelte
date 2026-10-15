<script lang="ts">
  import './cycle-count-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import type { CycleCountWarehouseQueueView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import CycleCountAssignedList from './CycleCountAssignedList.svelte';
  import CycleCountQueue from './CycleCountQueue.svelte';

  let { data, form }: { data: CycleCountWarehouseQueueView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.warehouse.cycle_count.title')}</title>
</svelte:head>

<div class="cycle-count-warehouse-queue-screen">
  <h1 class="cycle-count-warehouse-queue-screen__title">{t('logistic.warehouse.cycle_count.title')}</h1>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  {#if data.myCycleCounts.length > 0}
    <section class="cycle-count-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.cycle_count.mine')}>
      <h2 class="cycle-count-warehouse-queue-screen__section-title">{t('logistic.warehouse.cycle_count.mine')}</h2>
      <CycleCountAssignedList cycleCounts={data.myCycleCounts} dictionary={scoped} />
    </section>
  {/if}

  <section class="cycle-count-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.cycle_count.open')}>
    <h2 class="cycle-count-warehouse-queue-screen__section-title">{t('logistic.warehouse.cycle_count.open')}</h2>
    <CycleCountQueue cycleCounts={data.openCycleCounts} dictionary={scoped} />
  </section>
</div>
