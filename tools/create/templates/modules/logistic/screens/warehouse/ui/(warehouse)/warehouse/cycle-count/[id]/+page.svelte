<script lang="ts">
  import './cycle-count-warehouse-detail-screen.css';
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification, Input } from '@sveltebuilder/coreui';
  import type { CycleCountWarehouseDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

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

  <ol class="cycle-count-warehouse-detail-screen__lines">
    {#each count.lines as line (line.id)}
      <li class="cycle-count-warehouse-detail-screen__line" class:done={line.countedQuantity !== null}>
        <div class="cycle-count-warehouse-detail-screen__line-where">
          <span class="cycle-count-warehouse-detail-screen__location">
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </span>
          <code class="cycle-count-warehouse-detail-screen__sku">{line.sku}</code>
        </div>

        <!-- The expected quantity is deliberately not shown. A counter who can see what the
             system expects tends to confirm it; the whole value of a blind count is that
             they report what is actually there. The variance is computed afterwards. -->
        <form method="POST" action="?/record" class="cycle-count-warehouse-detail-screen__form" use:enhance>
          <input type="hidden" name="cycle_count_line_id" value={line.id} />
          <Input
            name="quantity"
            type="number"
            min="0"
            value={line.countedQuantity !== null ? String(line.countedQuantity) : ''}
            aria-label={t('logistic.warehouse.cycle_count.counted_quantity')}
          />
          <Button type="submit" variant="primary" size="sm">
            {t('logistic.warehouse.cycle_count.record')}
          </Button>
        </form>
      </li>
    {/each}
  </ol>

  <p class="cycle-count-warehouse-detail-screen__note">{t('logistic.warehouse.cycle_count.approval_note')}</p>
</div>
