<script lang="ts">
  import {
    Button, Badge, Field, Label, Input, Select, SelectItem,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
    ConfirmDialog,
  } from '@sveltebuilder/coreui';
  import { ReturnConditionBadge } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let processConfirmOpen = $state(false);

  const statusVariant = $derived(
    data.returnAuth.status === 'processed'  ? 'success'
    : data.returnAuth.status === 'received' ? 'brand'
    : data.returnAuth.status === 'cancelled'? 'danger'
    : 'default'
  ) as 'success' | 'brand' | 'danger' | 'default';

  const binLocations = $derived(data.locations.filter((l) => l.locationType === 'bin'));

  const canProcess = $derived(
    data.returnAuth.status === 'received' &&
    data.returnAuth.lines.every((l) => l.condition !== null)
  );

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="return-detail">
  <header class="return-detail__header">
    <div>
      <a href="/admin/logistic/return" class="return-detail__back">← Returns</a>
      <div class="return-detail__title-row">
        <h1 class="return-detail__title">RMA #{data.returnAuth.id}</h1>
        <Badge variant={statusVariant}>{data.returnAuth.status}</Badge>
      </div>
    </div>

    {#if canProcess}
      <Button variant="primary" onclick={() => (processConfirmOpen = true)}>
        Mark processed
      </Button>
    {/if}
  </header>

  {#if data.returnAuth.reason}
    <p class="return-detail__reason"><strong>Reason:</strong> {data.returnAuth.reason}</p>
  {/if}

  {#if data.returnAuth.note}
    <p class="return-detail__note">{data.returnAuth.note}</p>
  {/if}

  <section class="return-detail__lines">
    <h2 class="return-detail__section-title">Lines</h2>

    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>SKU</TableHeader>
          <TableHeader>Expected</TableHeader>
          <TableHeader>Received</TableHeader>
          <TableHeader>Condition</TableHeader>
          <TableHeader>Disposition</TableHeader>
          {#if data.returnAuth.status === 'pending' || data.returnAuth.status === 'received'}
            <TableHeader><span class="sr-only">Grade</span></TableHeader>
          {/if}
        </TableRow>
      </TableHead>
      <TableBody>
        {#each data.returnAuth.lines as line (line.id)}
          <TableRow>
            <TableCell><code class="return-detail__sku">{line.sku}</code></TableCell>
            <TableCell>{line.expectedQuantity}</TableCell>
            <TableCell>{line.receivedQuantity}</TableCell>
            <TableCell>
              {#if line.condition}
                <ReturnConditionBadge condition={line.condition} label={line.condition} />
              {:else}
                <span class="return-detail__pending-label">Pending</span>
              {/if}
            </TableCell>
            <TableCell>{line.disposition ?? '—'}</TableCell>
            {#if data.returnAuth.status === 'pending' || data.returnAuth.status === 'received'}
              <TableCell>
                <form method="POST" action="?/gradeLine" class="return-detail__grade-form">
                  <input type="hidden" name="line_id" value={line.id} />
                  <Input
                    name="received_quantity"
                    type="number"
                    min="0"
                    max={line.expectedQuantity}
                    value={line.receivedQuantity}
                    class="return-detail__qty-input"
                    aria-label="Received quantity"
                  />
                  <Select name="condition" required aria-label="Condition">
                    <SelectItem value="salable">Salable</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="defective">Defective</SelectItem>
                    <SelectItem value="wrong_item">Wrong item</SelectItem>
                  </Select>
                  <Select name="disposition" required aria-label="Disposition">
                    <SelectItem value="restock">Restock</SelectItem>
                    <SelectItem value="quarantine">Quarantine</SelectItem>
                    <SelectItem value="scrap">Scrap</SelectItem>
                    <SelectItem value="refurbish">Refurbish</SelectItem>
                  </Select>
                  <Select name="storage_location_id" aria-label="Restock location">
                    <SelectItem value="">No location</SelectItem>
                    {#each binLocations as loc}
                      <SelectItem value={String(loc.id)}>{loc.slug}</SelectItem>
                    {/each}
                  </Select>
                  <Button type="submit" variant="primary" size="sm">Grade</Button>
                </form>
              </TableCell>
            {/if}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </section>
</div>

<ConfirmDialog
  bind:open={processConfirmOpen}
  title="Mark return processed"
  description="This will finalize the return authorization. All graded lines will be routed according to their disposition."
  confirmLabel="Mark processed"
  onConfirm={async () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '?/process';
    document.body.appendChild(form);
    form.submit();
  }}
/>

<style>
  .return-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .return-detail__back {
    font-size: var(--text-sm);
    color: var(--color-text-link);
    text-decoration: none;
    display: block;
    margin-block-end: var(--space-2);
  }

  .return-detail__back:hover { text-decoration: underline; }

  .return-detail__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .return-detail__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .return-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .return-detail__reason,
  .return-detail__note {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .return-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3);
  }

  .return-detail__sku {
    font-family: var(--font-mono, monospace);
    font-size: var(--text-sm);
  }

  .return-detail__pending-label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    font-style: italic;
  }

  .return-detail__grade-form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    flex-wrap: wrap;
  }

  .return-detail__qty-input {
    width: 64px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
