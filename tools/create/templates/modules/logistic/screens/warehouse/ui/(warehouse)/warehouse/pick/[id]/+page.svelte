<script lang="ts">
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, ConfirmDialog, InlineNotification, Input } from '@sveltebuilder/coreui';
  import type { PickTaskDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: PickTaskDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const task = $derived(data.task);
  const remaining = $derived(
    task.lines.filter((line) => line.pickedQuantity < line.requestedQuantity).length
  );

  let completeConfirmOpen = $state(false);
  let completeForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
  <title>{t('logistic.pick.task')} #{task.id}</title>
</svelte:head>

<div class="pick-task">
  <header class="pick-task__header">
    <a href="/warehouse/pick" class="pick-task__back">← {t('logistic.warehouse.pick')}</a>
    <h1 class="pick-task__title">{t('logistic.pick.task')} #{task.id}</h1>
    <p class="pick-task__meta">
      {scoped.formatText(
        'logistic.pick.remaining',
        { remaining, total: task.lines.length },
        'logistic'
      )}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <ol class="pick-task__lines">
    {#each task.lines as line (line.id)}
      <li class="pick-task__line" class:done={line.pickedQuantity >= line.requestedQuantity}>
        <div class="pick-task__line-where">
          <!-- Location first and largest: the picker reads where to go before what to take. -->
          <span class="pick-task__location">
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </span>
          <code class="pick-task__sku">{line.sku}</code>
        </div>

        <div class="pick-task__line-what">
          <span class="pick-task__quantity">
            {scoped.formatText(
              'logistic.pick.picked_of',
              { picked: line.pickedQuantity, requested: line.requestedQuantity },
              'logistic'
            )}
          </span>

          <!-- use:enhance so recording one line does not scroll the picker away from where
               they are in the list. -->
          <form method="POST" action="?/pick" class="pick-task__form" use:enhance>
            <input type="hidden" name="line_id" value={line.id} />
            <Input
              name="quantity"
              type="number"
              min="0"
              max={String(line.requestedQuantity)}
              value={String(line.pickedQuantity)}
              aria-label={t('logistic.pick.quantity')}
            />
            <Button type="submit" variant="primary" size="sm">
              {t('logistic.pick.record')}
            </Button>
          </form>
        </div>
      </li>
    {/each}
  </ol>

  <Button variant="primary" full onclick={() => (completeConfirmOpen = true)}>
    {t('logistic.pick.complete')}
  </Button>
</div>

<form method="POST" action="?/complete" bind:this={completeForm} hidden></form>

<ConfirmDialog
  bind:open={completeConfirmOpen}
  title={t('logistic.pick.complete')}
  description={remaining > 0
    ? t('logistic.pick.complete_short')
    : t('logistic.pick.complete_confirm')}
  confirmLabel={t('logistic.pick.complete')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => completeForm?.requestSubmit()}
/>

<style>
  .pick-task {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .pick-task__back {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .pick-task__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: var(--space-2) 0 0;
  }

  .pick-task__meta {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .pick-task__lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .pick-task__line {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
  }

  .pick-task__line.done {
    opacity: 0.6;
  }

  .pick-task__line-where {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .pick-task__location {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
  }

  .pick-task__sku {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .pick-task__line-what {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .pick-task__quantity {
    font-size: var(--text-base);
    color: var(--color-text-primary);
  }

  .pick-task__form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
</style>
