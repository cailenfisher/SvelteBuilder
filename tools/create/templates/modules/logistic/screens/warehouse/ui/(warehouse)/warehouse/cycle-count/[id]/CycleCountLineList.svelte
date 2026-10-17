<!-- The count's lines in walk order, each recording what the counter found through this route's
     `record` action. A counted line is dimmed. -->
<script lang="ts">
  import './cycle-count-line-list.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Input } from '@sveltebuilder/coreui';
  import type { CycleCountLineRow } from '@sveltebuilder/logistic/views';

  type Props = {
    cycleCountLines: CycleCountLineRow[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { cycleCountLines, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<ol class="cycle-count-line-list">
  {#each cycleCountLines as line (line.id)}
    <li class="cycle-count-line-list__line" class:cycle-count-line-list__line--done={line.countedQuantity !== null}>
      <div class="cycle-count-line-list__line-where">
        <span class="cycle-count-line-list__location">
          {dictionary.localText('name', 'storage_location', line.storageLocationId)}
        </span>
        <code class="cycle-count-line-list__sku">{line.sku}</code>
      </div>

      <!-- The expected quantity is deliberately not shown. A counter who can see what the
           system expects tends to confirm it; the whole value of a blind count is that
           they report what is actually there. The variance is computed afterwards. -->
      <form method="POST" action="?/record" class="cycle-count-line-list__form" use:enhance>
        <input type="hidden" name="cycle_count_line_id" value={line.id} />
        <Input
          name="quantity"
          type="number"
          min="0"
          value={line.countedQuantity !== null ? String(line.countedQuantity) : ''}
          aria-label={localText('logistic.warehouse.cycle_count.counted_quantity')}
        />
        <Button type="submit" variant="primary" size="sm">
          {localText('logistic.warehouse.cycle_count.record')}
        </Button>
      </form>
    </li>
  {/each}
</ol>
