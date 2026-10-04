<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import type { CountQueueView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: CountQueueView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.warehouse.count')}</title>
</svelte:head>

<div class="count-queue">
  <h1 class="count-queue__title">{t('logistic.warehouse.count')}</h1>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  {#if data.myCounts.length > 0}
    <section class="count-queue__section" aria-label={t('logistic.count.mine')}>
      <h2 class="count-queue__section-title">{t('logistic.count.mine')}</h2>
      <ul class="count-queue__list">
        {#each data.myCounts as count (count.id)}
          <li class="count-queue__item">
            <a href="/warehouse/count/{count.id}" class="count-queue__link">
              {t('logistic.cycle_count.one')} #{count.id}
            </a>
            <span class="count-queue__progress">
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

  <section class="count-queue__section" aria-label={t('logistic.count.open')}>
    <h2 class="count-queue__section-title">{t('logistic.count.open')}</h2>
    {#if data.openCounts.length > 0}
      <ul class="count-queue__list">
        {#each data.openCounts as count (count.id)}
          <li class="count-queue__item">
            <span class="count-queue__label">
              {t('logistic.cycle_count.one')} #{count.id}
              <span class="count-queue__progress">
                {scoped.formatText('logistic.count.lines', { total: count.lineCount }, 'logistic')}
              </span>
            </span>
            <form method="POST" action="?/take">
              <input type="hidden" name="count_id" value={count.id} />
              <Button type="submit" variant="primary" size="sm">
                {t('logistic.count.take')}
              </Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="count-queue__empty">{t('logistic.count.empty')}</p>
    {/if}
  </section>
</div>

<style>
  .count-queue {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .count-queue__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .count-queue__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .count-queue__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: 0;
  }

  .count-queue__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .count-queue__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: 3.5rem;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background-color: var(--surface);
  }

  .count-queue__link,
  .count-queue__label {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--text);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .count-queue__progress,
  .count-queue__empty {
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    color: var(--text-soft);
  }

  .count-queue__empty {
    margin: 0;
  }
</style>
