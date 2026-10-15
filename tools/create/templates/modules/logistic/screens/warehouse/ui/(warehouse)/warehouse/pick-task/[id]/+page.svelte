<script lang="ts">
  import './pick-task-warehouse-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, ConfirmDialog, InlineNotification } from '@sveltebuilder/coreui';
  import type { PickTaskWarehouseDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import PickTaskLineList from './PickTaskLineList.svelte';

  let { data, form }: { data: PickTaskWarehouseDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  const task = $derived(data.pickTask);
  const remaining = $derived(
    task.lines.filter((line) => line.pickedQuantity < line.requestedQuantity).length
  );

  let completeConfirmOpen = $state(false);
  let completeForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
  <title>{localText('logistic.pick_task.one')} #{task.id}</title>
</svelte:head>

<div class="pick-task-warehouse-detail-screen">
  <header class="pick-task-warehouse-detail-screen__header">
    <a href="/warehouse/pick-task" class="pick-task-warehouse-detail-screen__back">← {localText('logistic.warehouse.pick_task.title')}</a>
    <h1 class="pick-task-warehouse-detail-screen__title">{localText('logistic.pick_task.one')} #{task.id}</h1>
    <p class="pick-task-warehouse-detail-screen__meta">
      {scoped.formatText(
        'logistic.warehouse.pick_task.remaining',
        { remaining, total: task.lines.length },
        'logistic'
      )}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <PickTaskLineList pickTaskLines={task.lines} dictionary={scoped} />

  <Button variant="primary" full onclick={() => (completeConfirmOpen = true)}>
    {localText('logistic.warehouse.pick_task.complete')}
  </Button>
</div>

<form method="POST" action="?/complete" bind:this={completeForm} hidden></form>

<ConfirmDialog
  bind:open={completeConfirmOpen}
  title={localText('logistic.warehouse.pick_task.complete')}
  description={remaining > 0
    ? localText('logistic.warehouse.pick_task.complete_short')
    : localText('logistic.warehouse.pick_task.complete_confirm')}
  confirmLabel={localText('logistic.warehouse.pick_task.complete')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => completeForm?.requestSubmit()}
/>
