<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import './pick-task-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { InlineNotification } from '@sveltebuilder/coreui';
  import type { PickTaskWarehouseQueueView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import PickTaskAssignedList from './PickTaskAssignedList.svelte';
  import PickTaskQueue from './PickTaskQueue.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: PickTaskWarehouseQueueView; form?: ScreenFormResult } = $props();

  const globalDictionary = getDictionary();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{localText('logistic.warehouse.pick_task.title')}</title>
</svelte:head>

<div class="pick-task-warehouse-queue-screen">
  <h1 class="pick-task-warehouse-queue-screen__title">{localText('logistic.warehouse.pick_task.title')}</h1>

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, globalDictionary)} detail={form.error.detail} />
  {/if}

  {#if data.myPickTasks.length > 0}
    <section class="pick-task-warehouse-queue-screen__section" aria-label={localText('logistic.warehouse.pick_task.mine')}>
      <h2 class="pick-task-warehouse-queue-screen__section-title">{localText('logistic.warehouse.pick_task.mine')}</h2>
      <PickTaskAssignedList pickTasks={data.myPickTasks} dictionary={scoped} />
    </section>
  {/if}

  <section class="pick-task-warehouse-queue-screen__section" aria-label={localText('logistic.warehouse.pick_task.open')}>
    <h2 class="pick-task-warehouse-queue-screen__section-title">
      {localText('logistic.warehouse.pick_task.open')}
      {#if data.openPickTaskTotal > data.openPickTasks.length}
        <span class="pick-task-warehouse-queue-screen__more">
          {scoped.formatText(
            'logistic.warehouse.pick_task.showing',
            { showing: data.openPickTasks.length, total: data.openPickTaskTotal },
            'logistic'
          )}
        </span>
      {/if}
    </h2>

    <PickTaskQueue pickTasks={data.openPickTasks} dictionary={scoped} />
  </section>
</div>
