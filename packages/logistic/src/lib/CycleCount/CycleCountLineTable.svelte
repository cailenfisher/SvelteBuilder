<!-- The count's lines in walk order: what the system expected in each bin, what was counted,
     and the difference that approval would apply. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { CycleCountLine } from '../schema/index.js';

  type Props = {
    cycleCountLines: CycleCountLine[];
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { cycleCountLines, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<Table class={['cycle-count-line-table', extraClass ?? ''].filter(Boolean).join(' ')}>
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('logistic.field.storage_location')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.field.sku')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.cycle_count.expected')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.cycle_count.counted')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.cycle_count.variance')}</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {#each cycleCountLines as line (line.id)}
      <TableRow>
        <TableCell>
          {dictionary.localText('name', 'storage_location', line.storageLocationId)}
        </TableCell>
        <TableCell><code class="cycle-count-line-table__sku">{line.sku}</code></TableCell>
        <TableCell>{line.expectedQuantity}</TableCell>
        <!-- Null counted is "nobody has counted this yet", which is not zero found. -->
        <TableCell>{line.countedQuantity ?? '—'}</TableCell>
        <TableCell>
          {#if line.variance !== null && line.variance !== 0}
            <span
              class="cycle-count-line-table__variance"
              class:cycle-count-line-table__variance--negative={line.variance < 0}
            >
              {line.variance > 0 ? '+' : ''}{line.variance}
            </span>
          {:else if line.variance === 0}
            {localText('logistic.cycle_count.matched')}
          {:else}
            —
          {/if}
        </TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
