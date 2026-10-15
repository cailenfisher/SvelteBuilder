<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import './cycle-count-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import type { CycleCountWarehouseQueueView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import CycleCountAssignedList from './CycleCountAssignedList.svelte';
  import CycleCountQueue from './CycleCountQueue.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: CycleCountWarehouseQueueView; form?: ScreenFormResult } = $props();

  const globalDictionary = getDictionary();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{localText('logistic.warehouse.cycle_count.title')}</title>
</svelte:head>

<div class="cycle-count-warehouse-queue-screen">
  <h1 class="cycle-count-warehouse-queue-screen__title">{localText('logistic.warehouse.cycle_count.title')}</h1>

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, globalDictionary)} detail={form.error.detail} />
  {/if}

  {#if data.myCycleCounts.length > 0}
    <section class="cycle-count-warehouse-queue-screen__section" aria-label={localText('logistic.warehouse.cycle_count.mine')}>
      <h2 class="cycle-count-warehouse-queue-screen__section-title">{localText('logistic.warehouse.cycle_count.mine')}</h2>
      <CycleCountAssignedList cycleCounts={data.myCycleCounts} dictionary={scoped} />
    </section>
  {/if}

  <section class="cycle-count-warehouse-queue-screen__section" aria-label={localText('logistic.warehouse.cycle_count.open')}>
    <h2 class="cycle-count-warehouse-queue-screen__section-title">{localText('logistic.warehouse.cycle_count.open')}</h2>
    <CycleCountQueue cycleCounts={data.openCycleCounts} dictionary={scoped} />
  </section>
</div>
