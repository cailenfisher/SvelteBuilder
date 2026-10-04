<script lang="ts">
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification, Input } from '@sveltebuilder/coreui';
  import type { CountDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: CountDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const count = $derived(data.cycleCount);
  const counted = $derived(count.lines.filter((line) => line.countedQuantity !== null).length);
</script>

<svelte:head>
  <title>{t('logistic.cycle_count.one')} #{count.id}</title>
</svelte:head>

<div class="count-task">
  <header class="count-task__header">
    <a href="/warehouse/count" class="count-task__back">← {t('logistic.warehouse.count')}</a>
    <h1 class="count-task__title">{t('logistic.cycle_count.one')} #{count.id}</h1>
    <p class="count-task__meta">
      {scoped.formatText(
        'logistic.cycle_count.progress_value',
        { counted, total: count.lines.length },
        'logistic'
      )}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <ol class="count-task__lines">
    {#each count.lines as line (line.id)}
      <li class="count-task__line" class:done={line.countedQuantity !== null}>
        <div class="count-task__line-where">
          <span class="count-task__location">
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </span>
          <code class="count-task__sku">{line.sku}</code>
        </div>

        <!-- The expected quantity is deliberately not shown. A counter who can see what the
             system expects tends to confirm it; the whole value of a blind count is that
             they report what is actually there. The variance is computed afterwards. -->
        <form method="POST" action="?/record" class="count-task__form" use:enhance>
          <input type="hidden" name="line_id" value={line.id} />
          <Input
            name="quantity"
            type="number"
            min="0"
            value={line.countedQuantity !== null ? String(line.countedQuantity) : ''}
            aria-label={t('logistic.count.counted_quantity')}
          />
          <Button type="submit" variant="primary" size="sm">
            {t('logistic.count.record')}
          </Button>
        </form>
      </li>
    {/each}
  </ol>

  <p class="count-task__note">{t('logistic.count.approval_note')}</p>
</div>

<style>
  .count-task {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .count-task__back {
    color: var(--text-soft);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .count-task__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: var(--space-2) 0 0;
  }

  .count-task__meta,
  .count-task__note {
    color: var(--text-soft);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .count-task__lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .count-task__line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding: var(--space-4);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background-color: var(--surface);
  }

  .count-task__line.done {
    opacity: 0.6;
  }

  .count-task__line-where {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .count-task__location {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--text);
  }

  .count-task__sku {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .count-task__form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
</style>
