<!-- The pick tasks this worker has taken and not finished, each linking back into it. -->
<script lang="ts">
  import './pick-task-assigned-list.css';
  import type { DictionaryInstance } from 'diglossia';
  import { PickTaskStatusBadge } from '@sveltebuilder/logistic';
  import type { PickTask } from '@sveltebuilder/logistic';

  type Props = {
    pickTasks: PickTask[];
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { pickTasks, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<ul class="pick-task-assigned-list">
  {#each pickTasks as task (task.id)}
    <li class="pick-task-assigned-list__entry">
      <a href="/warehouse/pick-task/{task.id}" class="pick-task-assigned-list__link">
        {localText('logistic.pick_task.one')} #{task.id}
      </a>
      <PickTaskStatusBadge
        status={task.status}
        label={localText(`logistic.pick_task.status.${task.status}`)}
      />
    </li>
  {/each}
</ul>
