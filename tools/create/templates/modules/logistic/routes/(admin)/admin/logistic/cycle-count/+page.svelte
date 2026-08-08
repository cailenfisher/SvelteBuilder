<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Button, Checkbox, DataTable, Dialog, StatusBadge } from '@sveltebuilder/coreui';
  import type { DataTableColumn } from '@sveltebuilder/coreui';
  import type { CycleCount, CycleCountStatus } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let newCountOpen = $state(false);

  function statusVariant(status: CycleCountStatus): 'success' | 'brand' | 'danger' | 'default' {
    return status === 'complete' ? 'success'
      : status === 'in_progress' ? 'brand'
      : status === 'cancelled' ? 'danger'
      : 'default';
  }

  const columns: DataTableColumn[] = [
    { key: 'id', label: 'Count' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
  ];

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

{#snippet countCell(row: CycleCount, column: DataTableColumn)}
  {#if column.key === 'id'}
    <a href="/admin/logistic/cycle-count/{row.id}" class="cycle-count-list__link">#{row.id}</a>
  {:else if column.key === 'status'}
    <StatusBadge
      variant={statusVariant(row.status)}
      label={localText(`logistic.cycle_count.status.${row.status}`, 'logistic')}
      size="sm"
    />
  {:else if column.key === 'createdAt'}
    {formatDate(row.createdAt)}
  {/if}
{/snippet}

<div class="cycle-count-list">
  <header class="cycle-count-list__header">
    <h1 class="cycle-count-list__title">Cycle counts</h1>
    <Button variant="primary" onclick={() => (newCountOpen = true)}>New cycle count</Button>
  </header>

  <DataTable
    columns={columns}
    rows={data.counts}
    rowKey={(row) => row.id}
    cell={countCell}
    emptyLabel="No cycle counts yet."
  />
</div>

<Dialog bind:open={newCountOpen} title="New cycle count">
  {#snippet children()}
    <form method="POST" action="?/create" class="cycle-count-new-form">
      <fieldset class="cycle-count-new-form__locations">
        <legend class="cycle-count-new-form__legend">Locations to count</legend>
        {#each data.locations as location (location.id)}
          <Checkbox
            name="location_ids"
            value={String(location.id)}
            label={localText('name', 'storage_location', location.id)}
          />
        {/each}
      </fieldset>

      <div class="cycle-count-new-form__actions">
        <Button variant="ghost" onclick={() => (newCountOpen = false)}>Cancel</Button>
        <Button type="submit" variant="primary">Create count</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .cycle-count-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-6);
    max-width: 80rem;
    margin-inline: auto;
    width: 100%;
  }

  .cycle-count-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .cycle-count-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .cycle-count-list__link {
    color: var(--color-text-link);
    text-decoration: none;
    font-weight: var(--weight-medium);
  }

  .cycle-count-list__link:hover {
    text-decoration: underline;
  }

  .cycle-count-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .cycle-count-new-form__locations {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    margin: 0;
  }

  .cycle-count-new-form__legend {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
    padding-inline: var(--space-1);
  }

  .cycle-count-new-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
