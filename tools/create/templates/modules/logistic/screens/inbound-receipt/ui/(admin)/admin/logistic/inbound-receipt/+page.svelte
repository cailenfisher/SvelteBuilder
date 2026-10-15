<script lang="ts">
  import './inbound-receipt-list-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Dialog, FilterLinkList, InlineNotification, Pagination } from '@sveltebuilder/coreui';
  import { INBOUND_RECEIPT_STATUSES, InboundReceiptList } from '@sveltebuilder/logistic';
  import type { InboundReceiptStatus } from '@sveltebuilder/logistic';
  import type { InboundReceiptListView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import InboundReceiptCreateForm from './InboundReceiptCreateForm.svelte';

  let { data, form }: { data: InboundReceiptListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');


  const filterHref = (status: InboundReceiptStatus | null) =>
    status === null ? '/admin/logistic/inbound-receipt' : `/admin/logistic/inbound-receipt?status=${status}`;

  let newReceiptOpen = $state(false);
</script>

<svelte:head>
  <title>{t('logistic.inbound_receipt.title')}</title>
</svelte:head>

<div class="inbound-receipt-list-screen">
  <header class="inbound-receipt-list-screen__header">
    <h1 class="inbound-receipt-list-screen__title">{t('logistic.inbound_receipt.title')}</h1>
    <Button variant="primary" onclick={() => (newReceiptOpen = true)}>
      {t('logistic.inbound_receipt.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <FilterLinkList
    label={t('logistic.inbound_receipt.filter_status')}
    links={[
      { href: filterHref(null), label: t('logistic.inbound_receipt.filter_all'), current: data.status === null },
      ...INBOUND_RECEIPT_STATUSES.map((status) => ({
        href: filterHref(status),
        label: t(`logistic.inbound_receipt.status.${status}`),
        current: data.status === status,
      })),
    ]}
  />

  <div class="inbound-receipt-list-screen__results">
    <InboundReceiptList
      inboundReceipts={data.inboundReceipts}
      href={(receipt) => `/admin/logistic/inbound-receipt/${receipt.id}`}
      locale={data.localeCode}
      emptyLabel={t('logistic.inbound_receipt.empty')}
      dictionary={scoped}
    />

    {#if data.total > data.perPage}
      <nav class="inbound-receipt-list-screen__pagination" aria-label={t('logistic.inbound_receipt.pagination')}>
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
              `/admin/logistic/inbound-receipt?page=${next}` +
                (data.status ? `&status=${data.status}` : '')
            )}
          previousLabel={dictionary.localText('pagination.previous')}
          nextLabel={dictionary.localText('pagination.next')}
          label={dictionary.localText('navigation.pagination')}
        />
      </nav>
    {/if}
  </div>
</div>

<Dialog bind:open={newReceiptOpen} title={t('logistic.inbound_receipt.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <InboundReceiptCreateForm
      suppliers={data.suppliers}
      dictionary={scoped}
      onCancel={() => (newReceiptOpen = false)}
    />
  {/snippet}
</Dialog>
