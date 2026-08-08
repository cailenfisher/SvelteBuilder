<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import {
    Button, Tabs, TabsList, TabsTrigger, TabsContent,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
    Dialog, Field, Label, Select, SelectItem, Input, Textarea,
    Pagination,
  } from '@sveltebuilder/coreui';
  import { ReceiptCard } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';
  import type { InboundReceiptStatus } from '@sveltebuilder/logistic';

  let { data }: { data: PageData } = $props();

  const statusTabs: Array<{ value: InboundReceiptStatus | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'complete', label: 'Complete' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  let newReceiptOpen = $state(false);
  let page = $state(data.page);

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="receipt-list">
  <header class="receipt-list__header">
    <h1 class="receipt-list__title">Inbound receipts</h1>
    <Button variant="primary" onclick={() => (newReceiptOpen = true)}>New receipt</Button>
  </header>

  <Tabs value={data.status ?? ''}>
    <TabsList aria-label="Filter receipts by status">
      {#each statusTabs as tab}
        <TabsTrigger
          value={tab.value}
          href="/admin/logistic/receipt{tab.value ? `?status=${tab.value}` : ''}"
        >
          {tab.label}
        </TabsTrigger>
      {/each}
    </TabsList>

    <TabsContent value={data.status ?? ''}>
      {#if data.receipts.length > 0}
        <div class="receipt-list__cards">
          {#each data.receipts as receipt (receipt.id)}
            <ReceiptCard
              {receipt}
              supplier={receipt.supplier}
              lines={receipt.lines}
              href="/admin/logistic/receipt/{receipt.id}"
              locale={data.locale.code}
            />
          {/each}
        </div>

        {#if data.total > data.perPage}
          <nav class="receipt-list__pagination" aria-label="Pagination">
            <Pagination count={data.total} perPage={data.perPage} bind:page />
          </nav>
        {/if}
      {:else}
        <p class="receipt-list__empty">No receipts found.</p>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<Dialog bind:open={newReceiptOpen} title="New inbound receipt">
  {#snippet children()}
    <form method="POST" action="?/create" class="receipt-new-form">
      <Field>
        <Label for="supplier-id">Supplier</Label>
        <Select id="supplier-id" name="supplier_id">
          <SelectItem value="">
            {localText('logistic.inbound_receipt.blind', 'logistic')}
          </SelectItem>
          {#each data.suppliers as supplier (supplier.id)}
            <SelectItem value={String(supplier.id)}>
              {localText('name', 'supplier', supplier.id)}
            </SelectItem>
          {/each}
        </Select>
      </Field>

      <Field>
        <Label for="expected-at">Expected delivery</Label>
        <Input id="expected-at" name="expected_at" type="date" />
      </Field>

      <Field>
        <Label for="receipt-note">Note (optional)</Label>
        <Textarea id="receipt-note" name="note" rows={3} />
      </Field>

      <div class="receipt-new-form__actions">
        <Button variant="ghost" onclick={() => (newReceiptOpen = false)}>Cancel</Button>
        <Button type="submit" variant="primary">Create receipt</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .receipt-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .receipt-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .receipt-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-list__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-block-start: var(--space-4);
  }

  .receipt-list__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: var(--space-8) 0 0;
  }

  .receipt-list__pagination {
    display: flex;
    justify-content: center;
    padding-block-start: var(--space-4);
  }

  .receipt-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .receipt-new-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding-block-start: var(--space-2);
  }
</style>
