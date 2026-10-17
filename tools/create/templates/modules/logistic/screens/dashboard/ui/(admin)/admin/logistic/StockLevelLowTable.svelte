<!-- Stock levels at or under their reorder point, each linking to its adjustment history. -->
<script lang="ts">
  import './stock-level-low-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import {
    Badge,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { StockLevelRow } from '@sveltebuilder/logistic/views';

  type Props = {
    stockLevels: StockLevelRow[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { stockLevels, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('logistic.field.sku')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.field.storage_location')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.field.available')}</TableHeaderCell>
      <TableHeaderCell>{localText('logistic.field.reorder_point')}</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {#each stockLevels as level (level.id)}
      <TableRow>
        <TableCell>
          <a href="/admin/logistic/stock-level?history={level.id}" class="stock-level-low-table__link">
            <code>{level.sku}</code>
          </a>
        </TableCell>
        <TableCell>
          {dictionary.localText('name', 'storage_location', level.storageLocationId)}
        </TableCell>
        <TableCell><Badge variant="warning">{level.available}</Badge></TableCell>
        <TableCell>{level.reorderPoint}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
