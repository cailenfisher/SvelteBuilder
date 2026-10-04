<script lang="ts">
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Button,
    Dialog,
    Field,
    InlineNotification,
    Input,
    Pagination,
    Select,
    SelectItem,
    Textarea,
  } from '@sveltebuilder/coreui';
  import { ReceiptCard } from '@sveltebuilder/logistic';
  import type { InboundReceiptStatus } from '@sveltebuilder/logistic';
  import type { InboundReceiptListView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: InboundReceiptListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const STATUSES: InboundReceiptStatus[] = ['pending', 'partial', 'complete', 'cancelled'];

  const filterHref = (status: InboundReceiptStatus | null) =>
    status === null ? '/admin/logistic/receipt' : `/admin/logistic/receipt?status=${status}`;

  let newReceiptOpen = $state(false);
</script>

<svelte:head>
  <title>{t('logistic.receipt.title')}</title>
</svelte:head>

<div class="receipt-list">
  <header class="receipt-list__header">
    <h1 class="receipt-list__title">{t('logistic.receipt.title')}</h1>
    <Button variant="primary" onclick={() => (newReceiptOpen = true)}>
      {t('logistic.receipt.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <!-- Links in a nav rather than a Tabs: the filter is server-side, so each option is a
       navigation to a different URL, not a panel swap. Tab semantics (role="tab" with
       aria-controls) would claim there are panels on this page to switch between, and
       aria-current="page" is what actually tells a screen reader which filter is on. -->
  <nav class="receipt-list__filters" aria-label={t('logistic.receipt.filter_status')}>
    <Button
      href={filterHref(null)}
      variant={data.status === null ? 'secondary' : 'ghost'}
      size="sm"
      aria-current={data.status === null ? 'page' : undefined}
    >
      {t('logistic.receipt.filter_all')}
    </Button>
    {#each STATUSES as status (status)}
      <Button
        href={filterHref(status)}
        variant={data.status === status ? 'secondary' : 'ghost'}
        size="sm"
        aria-current={data.status === status ? 'page' : undefined}
      >
        {t(`logistic.inbound_receipt.status.${status}`)}
      </Button>
    {/each}
  </nav>

  <div class="receipt-list__results">
    {#if data.receipts.length > 0}
      <div class="receipt-list__cards">
        {#each data.receipts as receipt (receipt.id)}
          <!-- Camp 2 component: it reads the supplier's name and the status label from
                 the dictionary, so it takes this screen's instance rather than context. -->
          <ReceiptCard
            {receipt}
            supplier={receipt.supplier}
            lines={receipt.lines}
            href="/admin/logistic/receipt/{receipt.id}"
            locale={data.localeCode}
            dictionary={scoped}
          />
        {/each}
      </div>

      {#if data.total > data.perPage}
        <nav class="receipt-list__pagination" aria-label={t('logistic.receipt.pagination')}>
          <!-- Paging is server-side, so a page change is a navigation rather than local
                 state: the loader owns the slice, and a reload or a shared URL has to land
                 on the same one. goto keeps the status filter, which is the other half of
                 what the loader read. -->
          <Pagination
            count={data.total}
            perPage={data.perPage}
            page={data.page}
            onPageChange={(next) =>
              goto(
                `/admin/logistic/receipt?page=${next}` +
                  (data.status ? `&status=${data.status}` : '')
              )}
          />
        </nav>
      {/if}
    {:else}
      <p class="receipt-list__empty">{t('logistic.receipt.empty')}</p>
    {/if}
  </div>
</div>

<Dialog bind:open={newReceiptOpen} title={t('logistic.receipt.new')}>
  {#snippet children()}
    <form method="POST" action="?/create" class="receipt-new-form">
      <!-- Field renders the <label for>; the control inherits its id from field context. -->
      <Field label={t('logistic.receipt.supplier')} id="supplier-id">
        <Select name="supplier_id">
          <!-- No supplier is a blind receipt, not a missing answer. -->
          <SelectItem value="" label={t('logistic.inbound_receipt.blind')} />
          {#each data.suppliers as supplier (supplier.id)}
            <SelectItem
              value={String(supplier.id)}
              label={scoped.localText('name', 'supplier', supplier.id)}
            />
          {/each}
        </Select>
      </Field>

      <Field label={t('logistic.receipt.expected_at')} id="expected-at">
        <Input name="expected_at" type="date" />
      </Field>

      <Field label={t('logistic.field.note')} id="receipt-note">
        <Textarea name="note" rows={3} />
      </Field>

      <div class="receipt-new-form__actions">
        <Button variant="ghost" onclick={() => (newReceiptOpen = false)}>
          {dictionary.localText('action.cancel')}
        </Button>
        <Button type="submit" variant="primary">{t('logistic.receipt.create')}</Button>
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
    flex-wrap: wrap;
  }

  .receipt-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .receipt-list__filters {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .receipt-list__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-block-start: var(--space-4);
  }

  .receipt-list__empty {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: var(--space-8) 0 0;
  }

  .receipt-list__pagination {
    margin-block-start: var(--space-4);
  }

  .receipt-new-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .receipt-new-form__actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }
</style>
