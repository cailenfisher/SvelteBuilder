<script lang="ts">
  import { Button, Badge } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="pick-queue">
  <h1 class="pick-queue__title">Pick queue</h1>

  {#if data.myTasks.length > 0}
    <section class="pick-queue__section">
      <h2 class="pick-queue__section-title">My tasks</h2>
      <ul class="pick-queue__list" aria-label="My in-progress pick tasks">
        {#each data.myTasks as task (task.id)}
          <li class="pick-queue__item pick-queue__item--mine">
            <div class="pick-queue__item-info">
              <span class="pick-queue__item-id">Task #{task.id}</span>
              <time class="pick-queue__item-date" datetime={task.createdAt}>
                {formatDate(task.createdAt)}
              </time>
            </div>
            <Button href="/warehouse/pick/{task.id}" variant="primary" size="sm">
              Continue
            </Button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="pick-queue__section">
    <h2 class="pick-queue__section-title">
      Open tasks
      {#if data.openTotal > 0}
        <Badge variant="default" size="sm">{data.openTotal}</Badge>
      {/if}
    </h2>

    {#if data.openTasks.length > 0}
      <ul class="pick-queue__list" aria-label="Open pick tasks">
        {#each data.openTasks as task (task.id)}
          <li class="pick-queue__item">
            <div class="pick-queue__item-info">
              <span class="pick-queue__item-id">Task #{task.id}</span>
              <time class="pick-queue__item-date" datetime={task.createdAt}>
                {formatDate(task.createdAt)}
              </time>
            </div>
            <form method="POST" action="?/take">
              <input type="hidden" name="task_id" value={task.id} />
              <Button type="submit" variant="ghost" size="sm">Take task</Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="pick-queue__empty">No open tasks right now.</p>
    {/if}
  </section>
</div>

<style>
  .pick-queue {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-4);
    max-width: 600px;
    margin-inline: auto;
    width: 100%;
  }

  .pick-queue__title {
    font-size: var(--text-xl);
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
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .pick-queue__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .pick-queue__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
  }

  .pick-queue__item--mine {
    border-color: var(--color-border-brand);
  }

  .pick-queue__item-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .pick-queue__item-id {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
  }

  .pick-queue__item-date {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .pick-queue__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
