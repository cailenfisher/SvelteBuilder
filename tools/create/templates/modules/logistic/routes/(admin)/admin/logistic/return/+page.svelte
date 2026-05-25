<script lang="ts">
  import {
    Button, Tabs, TabsList, TabsTrigger, TabsContent,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
    Dialog, Field, Label, Input, Textarea, Badge, Pagination,
  } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';
  import type { ReturnAuthorizationStatus } from '@sveltebuilder/logistic';

  let { data }: { data: PageData } = $props();

  const statusTabs: Array<{ value: ReturnAuthorizationStatus | ''; label: string }> = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'received', label: 'Received' },
    { value: 'processed', label: 'Processed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  let newReturnOpen = $state(false);
  let page = $state(data.page);

  function statusVariant(status: ReturnAuthorizationStatus) {
    return status === 'processed'  ? 'success'
      : status === 'received'      ? 'brand'
      : status === 'cancelled'     ? 'danger'
      : 'default';
  }

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(data.locale.code, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<div class="return-list">
  <header class="return-list__header">
    <h1 class="return-list__title">Return authorizations</h1>
    <Button variant="primary" onclick={() => (newReturnOpen = true)}>New RMA</Button>
  </header>

  <Tabs value={data.status ?? ''}>
    <TabsList aria-label="Filter returns by status">
      {#each statusTabs as tab}
        <TabsTrigger
          value={tab.value}
          href="/admin/logistic/return{tab.value ? `?status=${tab.value}` : ''}"
        >
          {tab.label}
        </TabsTrigger>
      {/each}
    </TabsList>

    <TabsContent value={data.status ?? ''}>
      {#if data.returns.length > 0}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>RMA</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Reason</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {#each data.returns as ret (ret.id)}
              <TableRow>
                <TableCell>
                  <a href="/admin/logistic/return/{ret.id}" class="return-list__link">
                    RMA #{ret.id}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(ret.status) as any} size="sm">
                    {ret.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(ret.createdAt)}</TableCell>
                <TableCell>{ret.reason ?? '—'}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>

        {#if data.total > data.perPage}
          <nav class="return-list__pagination" aria-label="Pagination">
            <Pagination count={data.total} perPage={data.perPage} bind:page />
          </nav>
        {/if}
      {:else}
        <p class="return-list__empty">No return authorizations found.</p>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<Dialog bind:open={newReturnOpen} title="New return authorization">
  {#snippet children()}
    <form method="POST" action="?/create" class="return-new-form">
      <Field>
        <Label for="return-sku">SKU</Label>
        <Input id="return-sku" name="sku" required placeholder="e.g. WIDGET-001" />
      </Field>
      <Field>
        <Label for="return-qty">Expected quantity</Label>
        <Input id="return-qty" name="expected_quantity" type="number" min="1" value="1" required />
      </Field>
      <Field>
        <Label for="return-reason">Reason</Label>
        <Input id="return-reason" name="reason" placeholder="Customer return reason..." />
      </Field>
      <Field>
        <Label for="return-note">Note (optional)</Label>
        <Textarea id="return-note" name="note" rows={2} />
      </Field>
      <div class="return-new-form__actions">
        <Button variant="ghost" onclick={() => (newReturnOpen = false)}>Cancel</Button>
        <Button type="submit" variant="primary">Create RMA</Button>
      </div>
    </form>
  {/snippet}
</Dialog>

<style>
  .return-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .return-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .return-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .return-list__link {
    color: var(--color-text-link);
    text-decoration: none;
    font-weight: var(--weight-medium);
  }

  .return-list__link:hover { text-decoration: underline; }

  .return-list__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: var(--space-8) 0 0;
  }

  .return-list__pagination {
    display: flex;
    justify-content: center;
    padding-block-start: var(--space-4);
  }

  .return-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .return-new-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding-block-start: var(--space-2);
  }
</style>
