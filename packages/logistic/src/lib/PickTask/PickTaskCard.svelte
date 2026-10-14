<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import StorageLocationPath from '../StorageLocation/StorageLocationPath.svelte';
  import PickTaskStatusBadge from './PickTaskStatusBadge.svelte';
  import type { PickTask, PickTaskLine, StorageLocation } from '../schema/index.js';

  type PickTaskLineWithLocation = PickTaskLine & { storageLocation: StorageLocation };

  type Props = {
    task: PickTask;
    lines?: PickTaskLineWithLocation[];
    href?: string;
    locale?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { task, lines = [], href, locale = 'en', dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const statusLabel = $derived(dictionary.localText(`logistic.pick_task.status.${task.status}`, 'logistic'));

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
          <StorageLocationPath location={line.storageLocation} {dictionary} />
        </li>
      {/each}
    </ul>
  {/if}
</article>
