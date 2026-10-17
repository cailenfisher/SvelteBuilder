<!-- The counts this worker has taken and not finished, each linking back into it with its
     progress. -->
<script lang="ts">
  import './cycle-count-assigned-list.css';
  import type { DictionaryInstance } from 'diglossia';
  import type { CycleCountRow } from '@sveltebuilder/logistic/views';

  type Props = {
    cycleCounts: CycleCountRow[];
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { cycleCounts, dictionary }: Props = $props();
</script>

<ul class="cycle-count-assigned-list">
  {#each cycleCounts as count (count.id)}
    <li class="cycle-count-assigned-list__entry">
      <a href="/warehouse/cycle-count/{count.id}" class="cycle-count-assigned-list__link">
        {dictionary.localText('logistic.cycle_count.one', 'logistic')} #{count.id}
      </a>
      <span class="cycle-count-assigned-list__progress">
        {dictionary.formatText(
          'logistic.cycle_count.progress_value',
          { counted: count.countedCount, total: count.lineCount },
          'logistic'
        )}
      </span>
    </li>
  {/each}
</ul>
