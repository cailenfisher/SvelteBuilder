<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import {
    Button, StatusBadge,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  } from '@sveltebuilder/coreui';
  import type { CycleCountStatus } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function statusVariant(status: CycleCountStatus): 'success' | 'brand' | 'danger' | 'default' {
    return status === 'complete' ? 'success'
      : status === 'in_progress' ? 'brand'
      : status === 'cancelled' ? 'danger'
      : 'default';
  }

  const countedLines = $derived(data.count.lines.filter((l) => l.countedQuantity !== null));
  const varianceLines = $derived(countedLines.filter((l) => l.variance !== 0));
  const approvable = $derived(
    (data.count.status === 'open' || data.count.status === 'in_progress') &&
      countedLines.length > 0,
  );
</script>

<div class="count-detail">
  <header class="count-detail__header">
    <div class="count-detail__header-row">
      <h1 class="count-detail__title">Cycle count #{data.count.id}</h1>
      <StatusBadge
        variant={statusVariant(data.count.status)}
        label={localText(`logistic.cycle_count.status.${data.count.status}`, 'logistic')}
        size="sm"
      />
    </div>
    <p class="count-detail__progress">
      {countedLines.length} of {data.count.lines.length} lines counted
      {#if varianceLines.length > 0}
        · {varianceLines.length} with variance
      {/if}
    </p>
  </header>

  <Table>
    <TableHead>
      <TableRow>
        <TableHeader>Location</TableHeader>
        <TableHeader>SKU</TableHeader>
        <TableHeader class="align-right">Expected</TableHeader>
        <TableHeader class="align-right">Counted</TableHeader>
        <TableHeader class="align-right">Variance</TableHeader>
      </TableRow>
    </TableHead>
    <TableBody>
      {#each data.count.lines as line (line.id)}
        <TableRow>
          <TableCell>{line.storageLocation.name}</TableCell>
          <TableCell><span class="count-detail__mono">{line.sku}</span></TableCell>
          <TableCell class="align-right">{line.expectedQuantity}</TableCell>
          <TableCell class="align-right">{line.countedQuantity ?? '—'}</TableCell>
          <TableCell class="align-right">
            {#if line.variance !== null && line.variance !== 0}
              <span class="count-detail__variance">
                {line.variance > 0 ? '+' : ''}{line.variance}
              </span>
            {:else if line.variance === 0}
              0
            {:else}
              —
            {/if}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>

  {#if approvable}
    <form method="POST" action="?/approve" class="count-detail__approve">
      <p class="count-detail__approve-note">
        Approving writes a stock adjustment for every counted line with variance.
        {#if countedLines.length < data.count.lines.length}
          Uncounted lines are skipped.
        {/if}
      </p>
      <Button type="submit" variant="primary">Approve count</Button>
    </form>
  {/if}
</div>

<style>
  .count-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-6);
    max-width: 60rem;
    margin-inline: auto;
    width: 100%;
  }

  .count-detail__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .count-detail__header-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .count-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .count-detail__progress {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .count-detail__mono {
    font-family: var(--font-mono);
  }

  .count-detail__variance {
    color: var(--color-warning-text);
    font-weight: var(--weight-semibold);
  }

  .count-detail__approve {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4);
    background-color: var(--color-surface-overlay);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
  }

  .count-detail__approve-note {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
