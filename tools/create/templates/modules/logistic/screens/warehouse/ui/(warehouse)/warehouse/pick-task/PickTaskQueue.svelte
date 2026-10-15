<!-- Pick tasks nobody has taken yet, each with the button that claims it through this route's
     `take` action. -->
<script lang="ts">
  import './pick-task-queue.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';
  import type { PickTask } from '@sveltebuilder/logistic';

  type Props = {
    pickTasks: PickTask[];
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { pickTasks, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

{#if pickTasks.length > 0}
  <ul class="pick-task-queue">
    {#each pickTasks as task (task.id)}
      <li class="pick-task-queue__entry">
        <span class="pick-task-queue__label">{localText('logistic.pick_task.one')} #{task.id}</span>
        <!-- A POST rather than a link: taking a task is a claim, and the loader's
             status = open predicate is what settles a race between two workers. -->
        <form method="POST" action="?/take">
          <input type="hidden" name="pick_task_id" value={task.id} />
          <Button type="submit" variant="primary" size="sm">
            {localText('logistic.warehouse.pick_task.take')}
          </Button>
        </form>
      </li>
    {/each}
  </ul>
{:else}
  <p class="pick-task-queue__empty">{localText('logistic.warehouse.pick_task.empty')}</p>
{/if}
