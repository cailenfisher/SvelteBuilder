<script lang="ts">
  import './inbound-receipt-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { InboundReceiptList } from '@sveltebuilder/logistic';
  import type { InboundReceiptWarehouseQueueView } from '@sveltebuilder/logistic/views';

  let { data }: { data: InboundReceiptWarehouseQueueView } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.warehouse.inbound_receipt.title')}</title>
</svelte:head>

<div class="inbound-receipt-warehouse-queue-screen">
  <h1 class="inbound-receipt-warehouse-queue-screen__title">{t('logistic.warehouse.inbound_receipt.title')}</h1>

  <section class="inbound-receipt-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.inbound_receipt.active')}>
    <h2 class="inbound-receipt-warehouse-queue-screen__section-title">{t('logistic.warehouse.inbound_receipt.active')}</h2>
    <InboundReceiptList
      inboundReceipts={data.activeInboundReceipts}
      href={(receipt) => `/warehouse/inbound-receipt/${receipt.id}`}
      locale={data.localeCode}
      emptyLabel={t('logistic.warehouse.inbound_receipt.empty')}
      dictionary={scoped}
    />
  </section>

  {#if data.recentInboundReceipts.length > 0}
    <section class="inbound-receipt-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.inbound_receipt.recent')}>
      <h2 class="inbound-receipt-warehouse-queue-screen__section-title">{t('logistic.warehouse.inbound_receipt.recent')}</h2>
      <!-- Completed receipts are orientation, not work: no href, so nothing invites a receiver
           to open a receipt there is nothing left to do on. -->
      <InboundReceiptList
        inboundReceipts={data.recentInboundReceipts}
        locale={data.localeCode}
        emptyLabel={t('logistic.warehouse.inbound_receipt.empty')}
        dictionary={scoped}
      />
    </section>
  {/if}
</div>
