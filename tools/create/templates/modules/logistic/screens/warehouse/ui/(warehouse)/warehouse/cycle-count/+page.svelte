<script lang="ts">
  import './cycle-count-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import type { CycleCountWarehouseQueueView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

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
      <ul class="cycle-count-warehouse-queue-screen__list">
        {#each data.myCycleCounts as count (count.id)}
          <li class="cycle-count-warehouse-queue-screen__item">
            <a href="/warehouse/cycle-count/{count.id}" class="cycle-count-warehouse-queue-screen__link">
              {t('logistic.cycle_count.one')} #{count.id}
            </a>
            <span class="cycle-count-warehouse-queue-screen__progress">
              {scoped.formatText(
                'logistic.cycle_count.progress_value',
                { counted: count.countedCount, total: count.lineCount },
                'logistic'
              )}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="cycle-count-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.cycle_count.open')}>
    <h2 class="cycle-count-warehouse-queue-screen__section-title">{t('logistic.warehouse.cycle_count.open')}</h2>
    {#if data.openCycleCounts.length > 0}
      <ul class="cycle-count-warehouse-queue-screen__list">
        {#each data.openCycleCounts as count (count.id)}
          <li class="cycle-count-warehouse-queue-screen__item">
            <span class="cycle-count-warehouse-queue-screen__label">
              {t('logistic.cycle_count.one')} #{count.id}
              <span class="cycle-count-warehouse-queue-screen__progress">
                {scoped.formatText('logistic.warehouse.cycle_count.lines', { total: count.lineCount }, 'logistic')}
              </span>
            </span>
            <form method="POST" action="?/take">
              <input type="hidden" name="cycle_count_id" value={count.id} />
              <Button type="submit" variant="primary" size="sm">
                {t('logistic.warehouse.cycle_count.take')}
              </Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="cycle-count-warehouse-queue-screen__empty">{t('logistic.warehouse.cycle_count.empty')}</p>
    {/if}
  </section>
</div>
