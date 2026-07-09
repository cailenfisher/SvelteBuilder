<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import StorageLocationPath from './StorageLocationPath.svelte';
  import PickTaskStatusBadge from './PickTaskStatusBadge.svelte';
  import type { PickTask, PickTaskLine, StorageLocation } from '../schema/index.js';

  type PickTaskLineWithLocation = PickTaskLine & { storageLocation: StorageLocation };

  type Props = {
    task: PickTask;
    lines?: PickTaskLineWithLocation[];
    href?: string;
    locale?: string;
    class?: string | undefined;
  };

  let { task, lines = [], href, locale = 'en', class: extraClass }: Props = $props();

  const statusLabel = $derived(localText(`logistic.pick_task.status.${task.status}`, 'logistic'));

  const completedLines = $derived(lines.filter((l) => l.pickedQuantity >= l.requestedQuantity));

  const completionPct = $derived(
    lines.length > 0 ? Math.round((completedLines.length / lines.length) * 100) : 0
  );

  const formattedDate = $derived(
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(task.createdAt))
  );

  const classes = $derived(
    ['pick-task-card', `pick-task-card--${task.status}`, extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<article class={classes}>
  <header class="pick-task-card__header">
    <div class="pick-task-card__title-row">
      <div>
        {#if href}
          <a class="pick-task-card__id-link" {href}>
            Task #{task.id}
          </a>
        {:else}
          <span class="pick-task-card__id">Task #{task.id}</span>
        {/if}
        <time class="pick-task-card__date" datetime={task.createdAt}>{formattedDate}</time>
      </div>

      <PickTaskStatusBadge status={task.status} label={statusLabel} />
    </div>

    {#if lines.length > 0}
      <div class="pick-task-card__progress" aria-label="{completionPct}% complete">
        <div class="pick-task-card__progress-track" aria-hidden="true">
          <div class="pick-task-card__progress-fill" style:width="{completionPct}%"></div>
        </div>
        <span class="pick-task-card__progress-label">
          {completedLines.length}/{lines.length} lines
        </span>
      </div>
    {/if}
  </header>

  {#if lines.length > 0}
    <ul class="pick-task-card__lines" aria-label="Pick lines">
      {#each lines as line (line.id)}
        <li class="pick-task-card__line" class:pick-task-card__line--done={line.pickedQuantity >= line.requestedQuantity}>
          <div class="pick-task-card__line-info">
            <span class="pick-task-card__sku">{line.sku}</span>
            <span class="pick-task-card__qty">
              {line.pickedQuantity}/{line.requestedQuantity}
            </span>
          </div>
          <StorageLocationPath location={line.storageLocation} />
        </li>
      {/each}
    </ul>
  {/if}
</article>

<style>
  .pick-task-card {
    background-color: var(--surface-raised);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .pick-task-card--open {
    border-inline-start: 3px solid var(--border-color);
  }

  .pick-task-card--in_progress {
    border-inline-start: 3px solid var(--brand);
  }

  .pick-task-card--completed {
    border-inline-start: 3px solid var(--success);
  }

  .pick-task-card--cancelled {
    opacity: 0.6;
  }

  .pick-task-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .pick-task-card__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .pick-task-card__id-link,
  .pick-task-card__id {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text);
    text-decoration: none;
    display: block;
  }

  .pick-task-card__id-link:hover {
    color: var(--link-text);
  }

  .pick-task-card__date {
    font-size: var(--text-xs);
    color: var(--text-soft);
    display: block;
    margin-block-start: var(--space-1);
  }

  .pick-task-card__progress {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .pick-task-card__progress-track {
    flex: 1;
    height: 4px;
    background-color: var(--surface-overlay);
    border-radius: 2px;
    overflow: hidden;
  }

  .pick-task-card__progress-fill {
    height: 100%;
    background-color: var(--success);
    border-radius: 2px;
    transition: width var(--duration) var(--ease);
  }

  .pick-task-card__progress-label {
    font-size: var(--text-xs);
    color: var(--text-soft);
    white-space: nowrap;
  }

  .pick-task-card__lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .pick-task-card__line {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2);
    background-color: var(--surface-overlay);
    border-radius: var(--radius-sm);
  }

  .pick-task-card__line--done {
    opacity: 0.5;
  }

  .pick-task-card__line-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .pick-task-card__sku {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    font-family: var(--font-mono, monospace);
    color: var(--text);
  }

  .pick-task-card__qty {
    font-size: var(--text-sm);
    color: var(--text-soft);
    white-space: nowrap;
  }
</style>
