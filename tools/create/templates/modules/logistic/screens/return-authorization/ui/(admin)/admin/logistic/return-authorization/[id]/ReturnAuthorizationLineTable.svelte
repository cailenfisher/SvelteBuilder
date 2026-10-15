<!-- The return's lines: what was expected, what arrived, and how it was graded. While the
     return is open, each line can be graded from its row. -->
<script lang="ts">
  import './return-authorization-line-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import { ReturnConditionBadge } from '@sveltebuilder/logistic';
  import type {
    ReturnAuthorizationLine,
    ReturnCondition,
    ReturnDisposition,
  } from '@sveltebuilder/logistic';
  import type { StorageLocationOption } from '@sveltebuilder/logistic/views';
  import ReturnAuthorizationLineGradeForm from './ReturnAuthorizationLineGradeForm.svelte';

  type Props = {
    returnAuthorizationLines: ReturnAuthorizationLine[];
    /** Whether the return still accepts grading, which adds the grade column. */
    gradable: boolean;
    conditions: readonly ReturnCondition[];
    dispositions: readonly ReturnDisposition[];
    storageLocations: StorageLocationOption[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let {
    returnAuthorizationLines,
    gradable,
    conditions,
    dispositions,
    storageLocations,
    dictionary,
  }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

{#if returnAuthorizationLines.length > 0}
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{localText('logistic.field.sku')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.return_authorization.expected_quantity')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.return_authorization.received_quantity')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.return_authorization.condition')}</TableHeaderCell>
        <TableHeaderCell>{localText('logistic.return_authorization.disposition')}</TableHeaderCell>
        {#if gradable}
          <TableHeaderCell>{localText('logistic.return_authorization.grade')}</TableHeaderCell>
        {/if}
      </TableRow>
    </TableHead>
    <TableBody>
      {#each returnAuthorizationLines as line (line.id)}
        <TableRow>
          <TableCell><code class="return-authorization-line-table__sku">{line.sku}</code></TableCell>
          <TableCell>{line.expectedQuantity}</TableCell>
          <TableCell>{line.receivedQuantity}</TableCell>
          <TableCell>
            {#if line.condition !== null}
              <ReturnConditionBadge
                condition={line.condition}
                label={localText(`logistic.return_authorization.condition.${line.condition}`)}
              />
            {:else}
              —
            {/if}
          </TableCell>
          <TableCell>
            {line.disposition !== null
              ? localText(`logistic.return_authorization.disposition.${line.disposition}`)
              : '—'}
          </TableCell>
          {#if gradable}
            <TableCell>
              <ReturnAuthorizationLineGradeForm
                returnAuthorizationLine={line}
                {conditions}
                {dispositions}
                {storageLocations}
                {dictionary}
              />
            </TableCell>
          {/if}
        </TableRow>
      {/each}
    </TableBody>
  </Table>
{:else}
  <p class="return-authorization-line-table__empty">
    {localText('logistic.return_authorization.lines_empty')}
  </p>
{/if}
