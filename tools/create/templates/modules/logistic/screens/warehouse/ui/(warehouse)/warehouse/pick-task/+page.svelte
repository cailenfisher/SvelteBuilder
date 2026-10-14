<script lang="ts">
  import './pick-task-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import { PickTaskStatusBadge } from '@sveltebuilder/logistic';
  import type { PickTaskWarehouseQueueView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: PickTaskWarehouseQueueView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.warehouse.pick_task.title')}</title>
</svelte:head>

<div class="pick-task-warehouse-queue-screen">
  <h1 class="pick-task-warehouse-queue-screen__title">{t('logistic.warehouse.pick_task.title')}</h1>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  {#if data.myPickTasks.length > 0}
    <section class="pick-task-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.pick_task.mine')}>
      <h2 class="pick-task-warehouse-queue-screen__section-title">{t('logistic.warehouse.pick_task.mine')}</h2>
      <ul class="pick-task-warehouse-queue-screen__list">
        {#each data.myPickTasks as task (task.id)}
          <li class="pick-task-warehouse-queue-screen__item">
            <a href="/warehouse/pick-task/{task.id}" class="pick-task-warehouse-queue-screen__link">
              {t('logistic.pick_task.one')} #{task.id}
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

  <section class="pick-task-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.pick_task.open')}>
    <h2 class="pick-task-warehouse-queue-screen__section-title">
      {t('logistic.warehouse.pick_task.open')}
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

    {#if data.openPickTasks.length > 0}
      <ul class="pick-task-warehouse-queue-screen__list">
        {#each data.openPickTasks as task (task.id)}
          <li class="pick-task-warehouse-queue-screen__item">
            <span class="pick-task-warehouse-queue-screen__label">{t('logistic.pick_task.one')} #{task.id}</span>
            <!-- A POST rather than a link: taking a task is a claim, and the loader's
                 status = open predicate is what settles a race between two workers. -->
            <form method="POST" action="?/take">
              <input type="hidden" name="pick_task_id" value={task.id} />
              <Button type="submit" variant="primary" size="sm">
                {t('logistic.warehouse.pick_task.take')}
              </Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="pick-task-warehouse-queue-screen__empty">{t('logistic.warehouse.pick_task.empty')}</p>
    {/if}
  </section>
</div>
