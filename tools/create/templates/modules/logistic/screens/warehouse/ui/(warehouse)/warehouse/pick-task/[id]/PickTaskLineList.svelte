<!-- The task's lines in walk order, each recording what was picked through this route's `pick`
     action. A line already picked in full is dimmed. -->
<script lang="ts">
  import './pick-task-line-list.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Input } from '@sveltebuilder/coreui';
  import type { PickTaskLineRow } from '@sveltebuilder/logistic/views';

  type Props = {
    pickTaskLines: PickTaskLineRow[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { pickTaskLines, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<ol class="pick-task-line-list">
  {#each pickTaskLines as line (line.id)}
    <li class="pick-task-line-list__line" class:pick-task-line-list__line--done={line.pickedQuantity >= line.requestedQuantity}>
      <div class="pick-task-line-list__line-where">
        <!-- Location first and largest: the picker reads where to go before what to take. -->
        <span class="pick-task-line-list__location">
          {dictionary.localText('name', 'storage_location', line.storageLocationId)}
        </span>
        <code class="pick-task-line-list__sku">{line.sku}</code>
      </div>

      <div class="pick-task-line-list__line-what">
        <span class="pick-task-line-list__quantity">
          {dictionary.formatText(
            'logistic.warehouse.pick_task.picked_of',
            { picked: line.pickedQuantity, requested: line.requestedQuantity },
            'logistic'
          )}
        </span>

        <!-- use:enhance so recording one line does not scroll the picker away from where
             they are in the list. -->
        <form method="POST" action="?/pick" class="pick-task-line-list__form" use:enhance>
          <input type="hidden" name="pick_task_line_id" value={line.id} />
          <Input
            name="quantity"
            type="number"
            min="0"
            max={String(line.requestedQuantity)}
            value={String(line.pickedQuantity)}
            aria-label={localText('logistic.warehouse.pick_task.quantity')}
          />
          <Button type="submit" variant="primary" size="sm">
            {localText('logistic.warehouse.pick_task.record')}
          </Button>
        </form>
      </div>
    </li>
  {/each}
</ol>
