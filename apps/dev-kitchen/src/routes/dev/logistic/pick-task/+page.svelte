<script lang="ts">
  import { PickTaskCard, PickTaskStatusBadge } from '@sveltebuilder/logistic';
  import Example from '$lib/Example.svelte';
  import { PICK_LINES, PICK_TASKS, logisticDictionary } from '$lib/fixtures/logistic';

  const dictionary = logisticDictionary();
</script>

<Example title="PickTaskCard, in progress, with lines">
  <div style:inline-size="min(100%, 28rem)">
    <PickTaskCard
      task={PICK_TASKS[1]}
      lines={PICK_LINES}
      href="#pick-92"
      locale="en"
      {dictionary}
    />
  </div>
</Example>

<Example title="PickTaskCard, every status">
  {#each PICK_TASKS as task (task.id)}
    <div style:inline-size="min(100%, 18rem)">
      <PickTaskCard {task} locale="en" {dictionary} />
    </div>
  {/each}
</Example>

<Example title="PickTaskStatusBadge">
  {#each PICK_TASKS as task (task.id)}
    <PickTaskStatusBadge
      status={task.status}
      label={dictionary.localText(`logistic.pick_task.status.${task.status}`, 'logistic')}
    />
  {/each}
</Example>
