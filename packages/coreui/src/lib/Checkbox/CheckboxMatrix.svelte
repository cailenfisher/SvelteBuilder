<script module lang="ts">
  /**
   * A row of the matrix: its key, and the header text naming it. Keys become part of element
   * ids, so they hold letters, digits, `-` and `_` only.
   */
  export type CheckboxMatrixRow = {
    key: string;
    label: string;
  };

  /** A column of the matrix: its key, and the header text naming it. */
  export type CheckboxMatrixColumn = {
    key: string;
    label: string;
  };

  /**
   * One box. A row and column with no cell render an empty cell: not every row offers every
   * column.
   */
  export type CheckboxMatrixCell = {
    rowKey: string;
    columnKey: string;
    /** Submitted under the matrix's `name` while the box is checked. */
    value: string;
    checked: boolean;
    /**
     * Set when the value is held through something else, such as a broader grant. The box
     * renders checked and read-only, is not submitted, and shows this text beside it as its
     * description, so the state is never told by colour alone.
     */
    inheritedFrom?: string;
  };
</script>

<script lang="ts">
  import Checkbox from './Checkbox.svelte';
  import Table from '../Table/Table.svelte';
  import TableBody from '../Table/TableBody.svelte';
  import TableCell from '../Table/TableCell.svelte';
  import TableHead from '../Table/TableHead.svelte';
  import TableHeaderCell from '../Table/TableHeaderCell.svelte';
  import TableRow from '../Table/TableRow.svelte';

  type Props = {
    /** Prefix for the header ids each box is named by. Unique on the page, as for `Field`. */
    id: string;
    /** The table's caption, and its accessible name. */
    caption: string;
    rows: CheckboxMatrixRow[];
    columns: CheckboxMatrixColumn[];
    cells: CheckboxMatrixCell[];
    /** The form field every checked box submits its `value` under. Omit for a matrix no form reads. */
    name?: string;
    /** Every box read-only: shown, focusable, not toggleable, not submitted. */
    readonly?: boolean;
    /** Called when a box is toggled, with the cell and its new state. */
    onCheckedChange?: (cell: CheckboxMatrixCell, checked: boolean) => void;
    class?: string | undefined;
  };

  let {
    id,
    caption,
    rows,
    columns,
    cells,
    name,
    readonly = false,
    onCheckedChange,
    class: extraClass,
  }: Props = $props();

  const cellIndex = $derived(new Map(cells.map((cell) => [`${cell.rowKey}\u0000${cell.columnKey}`, cell])));

  const rootClasses = $derived(['checkbox-matrix', extraClass ?? ''].filter(Boolean).join(' '));

  const rowHeaderId = (row: CheckboxMatrixRow) => `${id}-row-${row.key}`;
  const columnHeaderId = (column: CheckboxMatrixColumn) => `${id}-column-${column.key}`;
  const sourceId = (cell: CheckboxMatrixCell) => `${id}-source-${cell.rowKey}-${cell.columnKey}`;
</script>

<Table {caption} class={rootClasses}>
  <TableHead>
    <TableRow>
      <!-- The corner names nothing, so it is a data cell: an empty header would be announced. -->
      <TableCell><span></span></TableCell>
      {#each columns as column (column.key)}
        <TableHeaderCell scope="col" class="checkbox-matrix__column-header">
          <span id={columnHeaderId(column)}>{column.label}</span>
        </TableHeaderCell>
      {/each}
    </TableRow>
  </TableHead>
  <TableBody>
    {#each rows as row (row.key)}
      <TableRow>
        <TableHeaderCell scope="row" class="checkbox-matrix__row-header">
          <span id={rowHeaderId(row)}>{row.label}</span>
        </TableHeaderCell>
        {#each columns as column (column.key)}
          {@const cell = cellIndex.get(`${row.key}\u0000${column.key}`)}
          <TableCell class="checkbox-matrix__cell">
            {#if cell}
              {@const inherited = cell.inheritedFrom !== undefined}
              <span class="checkbox-matrix__cell-content">
                <Checkbox
                  checked={inherited || cell.checked}
                  readonly={readonly || inherited}
                  name={readonly || inherited ? undefined : name}
                  value={cell.value}
                  aria-labelledby={`${rowHeaderId(row)} ${columnHeaderId(column)}`}
                  aria-describedby={inherited ? sourceId(cell) : undefined}
                  onCheckedChange={(checked) => onCheckedChange?.(cell, checked)}
                />
                {#if inherited}
                  <span id={sourceId(cell)} class="checkbox-matrix__source">{cell.inheritedFrom}</span>
                {/if}
              </span>
            {/if}
          </TableCell>
        {/each}
      </TableRow>
    {/each}
  </TableBody>
</Table>
