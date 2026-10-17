<!-- Counts nobody has taken yet, each with the button that claims it through this route's
     `take` action. -->
<script lang="ts">
  import './cycle-count-queue.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';
  import type { CycleCountRow } from '@sveltebuilder/logistic/views';

  type Props = {
    cycleCounts: CycleCountRow[];
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { cycleCounts, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

{#if cycleCounts.length > 0}
  <ul class="cycle-count-queue">
    {#each cycleCounts as count (count.id)}
      <li class="cycle-count-queue__entry">
        <span class="cycle-count-queue__label">
          {localText('logistic.cycle_count.one')} #{count.id}
          <span class="cycle-count-queue__line-count">
            {dictionary.formatText('logistic.warehouse.cycle_count.lines', { total: count.lineCount }, 'logistic')}
          </span>
        </span>
        <form method="POST" action="?/take">
          <input type="hidden" name="cycle_count_id" value={count.id} />
          <Button type="submit" variant="primary" size="sm">
            {localText('logistic.warehouse.cycle_count.take')}
          </Button>
        </form>
      </li>
    {/each}
  </ul>
{:else}
  <p class="cycle-count-queue__empty">{localText('logistic.warehouse.cycle_count.empty')}</p>
{/if}
