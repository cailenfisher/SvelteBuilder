<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { MetricCard, Button, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const pageTitle = $derived(localText('logistic.admin.dashboard.title', 'logistic'));
</script>

<div class="logistic-dashboard">
  <h1 class="logistic-dashboard__title">{pageTitle}</h1>

  <div class="logistic-dashboard__metrics">
    <MetricCard
      value={data.metrics.openPickTaskCount}
      label="Open pick tasks"
    />
    <MetricCard
      value={data.metrics.pendingReceiptCount}
      label="Pending receipts"
    />
    <MetricCard
      value={data.metrics.openReturnCount}
      label="Open returns"
    />
    <MetricCard
      value={data.metrics.openCycleCountCount}
      label="Active cycle counts"
    />
  </div>

  <div class="logistic-dashboard__sections">
    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">Pending receipts</h2>
        <Button href="/admin/logistic/receipt" variant="ghost" size="sm">View all</Button>
      </div>
      {#if data.recentReceipts.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Receipt</TableHeader>
              <TableHeader>Supplier</TableHeader>
              <TableHeader>Expected</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.recentReceipts as receipt (receipt.id)}
              <TableRow>
                <TableCell>
                  <a href="/admin/logistic/receipt/{receipt.id}" class="logistic-dashboard__link">
                    #{receipt.id}
                  </a>
                </TableCell>
                <TableCell>{localText('name', 'supplier', receipt.supplierId)}</TableCell>
                <TableCell>
                  {receipt.expectedAt
                    ? new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(receipt.expectedAt))
                    : '—'}
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="logistic-dashboard__empty">No pending receipts.</p>
      {/if}
    </section>

    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">Open pick tasks</h2>
        <Button href="/admin/logistic/pick-task" variant="ghost" size="sm">View all</Button>
      </div>
      {#if data.openTasks.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Task</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.openTasks as task (task.id)}
              <TableRow>
                <TableCell>
                  <a href="/admin/logistic/pick-task/{task.id}" class="logistic-dashboard__link">
                    Task #{task.id}
                  </a>
                </TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(task.createdAt))}
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="logistic-dashboard__empty">No open pick tasks.</p>
      {/if}
    </section>

    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">Open returns</h2>
        <Button href="/admin/logistic/return" variant="ghost" size="sm">View all</Button>
      </div>
      {#if data.openReturns.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Return</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.openReturns as ret (ret.id)}
              <TableRow>
                <TableCell>
                  <a href="/admin/logistic/return/{ret.id}" class="logistic-dashboard__link">
                    RMA #{ret.id}
                  </a>
                </TableCell>
                <TableCell>
                  {new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(ret.createdAt))}
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {:else}
        <p class="logistic-dashboard__empty">No open returns.</p>
      {/if}
    </section>
  </div>

  <nav class="logistic-dashboard__nav" aria-label="Logistic sections">
    <Button href="/admin/logistic/supplier" variant="ghost">Suppliers</Button>
    <Button href="/admin/logistic/receipt" variant="ghost">Inbound receipts</Button>
    <Button href="/admin/logistic/pick-task" variant="ghost">Pick tasks</Button>
    <Button href="/admin/logistic/return" variant="ghost">Returns</Button>
  </nav>
</div>

<style>
  .logistic-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-6);
    max-width: 80rem;
    margin-inline: auto;
  }

  .logistic-dashboard__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .logistic-dashboard__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--space-4);
  }

  .logistic-dashboard__sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .logistic-dashboard__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .logistic-dashboard__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .logistic-dashboard__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .logistic-dashboard__link {
    color: var(--color-text-link);
    text-decoration: none;
    font-weight: var(--weight-medium);
  }

  .logistic-dashboard__link:hover {
    text-decoration: underline;
  }

  .logistic-dashboard__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    padding: var(--space-4) 0;
  }

  .logistic-dashboard__nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding-block-start: var(--space-4);
    border-block-start: 1px solid var(--color-border-default);
  }
</style>
