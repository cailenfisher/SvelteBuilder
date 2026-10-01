<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import { PickTaskStatusBadge } from '@sveltebuilder/logistic';
  import type { PickQueueView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: PickQueueView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.warehouse.pick')}</title>
</svelte:head>

<div class="pick-queue">
  <h1 class="pick-queue__title">{t('logistic.warehouse.pick')}</h1>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  {#if data.myTasks.length > 0}
    <section class="pick-queue__section" aria-label={t('logistic.pick.mine')}>
      <h2 class="pick-queue__section-title">{t('logistic.pick.mine')}</h2>
      <ul class="pick-queue__list">
        {#each data.myTasks as task (task.id)}
          <li class="pick-queue__item">
            <a href="/warehouse/pick/{task.id}" class="pick-queue__link">
              {t('logistic.pick.task')} #{task.id}
            </a>
            <!-- Camp 1 component: it takes the label as a plain string and maps the
                 status to a variant itself. -->
            <PickTaskStatusBadge
              status={task.status}
              label={t(`logistic.pick_task.status.${task.status}`)}
            />
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="pick-queue__section" aria-label={t('logistic.pick.open')}>
    <h2 class="pick-queue__section-title">
      {t('logistic.pick.open')}
      {#if data.openTotal > data.openTasks.length}
        <span class="pick-queue__more">
          {scoped.formatText(
            'logistic.pick.showing',
            { showing: data.openTasks.length, total: data.openTotal },
            'logistic'
          )}
        </span>
      {/if}
    </h2>

    {#if data.openTasks.length > 0}
      <ul class="pick-queue__list">
        {#each data.openTasks as task (task.id)}
          <li class="pick-queue__item">
            <span class="pick-queue__label">{t('logistic.pick.task')} #{task.id}</span>
            <!-- A POST rather than a link: taking a task is a claim, and the loader's
                 status = open predicate is what settles a race between two workers. -->
            <form method="POST" action="?/take">
              <input type="hidden" name="task_id" value={task.id} />
              <Button type="submit" variant="primary" size="sm">
                {t('logistic.pick.take')}
              </Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="pick-queue__empty">{t('logistic.pick.empty')}</p>
    {/if}
  </section>
</div>

<style>
  .pick-queue {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .pick-queue__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .pick-queue__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .pick-queue__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .pick-queue__more,
  .pick-queue__empty {
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    color: var(--color-text-secondary);
  }

  .pick-queue__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .pick-queue__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    /* Generous rows: this is a touch target for someone holding a scanner. */
    min-height: 3.5rem;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background-color: var(--color-surface-default);
  }

  .pick-queue__link,
  .pick-queue__label {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .pick-queue__empty {
    margin: 0;
  }
</style>
