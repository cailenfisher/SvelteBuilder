<!-- One page of return authorizations, each linking to its detail screen. -->
<script lang="ts">
  import './return-authorization-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Badge, DataTable } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { ReturnAuthorizationStatus } from '@sveltebuilder/logistic';
  import type { ReturnAuthorizationRow } from '@sveltebuilder/logistic/views';

  type Props = {
    returnAuthorizations: ReturnAuthorizationRow[];
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    localeCode: string;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let {
    returnAuthorizations,
    page,
    perPage,
    total,
    onPageChange,
    localeCode,
    dictionary,
  }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const columns: DataTableColumn[] = $derived([
    { key: 'id', label: localText('logistic.return_authorization.one') },
    { key: 'status', label: localText('logistic.return_authorization.status_label') },
    { key: 'reason', label: localText('logistic.return_authorization.reason') },
    { key: 'lineCount', label: localText('logistic.return_authorization.lines'), align: 'end' },
    { key: 'createdAt', label: localText('logistic.return_authorization.created_at') },
  ]);

  const statusVariant = (status: ReturnAuthorizationStatus) =>
    status === 'processed'
      ? 'success'
      : status === 'received'
        ? 'warning'
        : status === 'cancelled'
          ? 'danger'
          : 'default';

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

{#snippet returnAuthorizationCell(row: ReturnAuthorizationRow, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/return-authorization/{row.id}" class="return-authorization-table__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <Badge variant={statusVariant(row.status)}>
      {localText(`logistic.return_authorization.status.${row.status}`)}
    </Badge>
  {:else if column.key === 'reason'}
    {row.reason ?? '—'}
  {:else if column.key === 'lineCount'}
    {row.lineCount}
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<DataTable
  {columns}
  rows={returnAuthorizations}
  rowKey={(row) => row.id}
  cell={returnAuthorizationCell}
  {page}
  {perPage}
  {total}
  {onPageChange}
  labels={{
    empty: localText('logistic.return_authorization.empty'),
    pagination: globalDictionary.localText('navigation.pagination'),
    previousPage: globalDictionary.localText('pagination.previous'),
    nextPage: globalDictionary.localText('pagination.next'),
  }}
/>
