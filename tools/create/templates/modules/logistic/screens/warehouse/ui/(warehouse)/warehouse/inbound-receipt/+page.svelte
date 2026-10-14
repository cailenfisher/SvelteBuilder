<script lang="ts">
  import './inbound-receipt-warehouse-queue-screen.css';
  import { createDictionary } from 'diglossia';
  import { InboundReceiptCard } from '@sveltebuilder/logistic';
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
    {#if data.activeInboundReceipts.length > 0}
      <div class="inbound-receipt-warehouse-queue-screen__cards">
        {#each data.activeInboundReceipts as receipt (receipt.id)}
          <InboundReceiptCard
            {receipt}
            supplier={receipt.supplier}
            lines={receipt.lines}
            href="/warehouse/inbound-receipt/{receipt.id}"
            locale={data.localeCode}
            dictionary={scoped}
          />
        {/each}
      </div>
    {:else}
      <p class="inbound-receipt-warehouse-queue-screen__empty">{t('logistic.warehouse.inbound_receipt.empty')}</p>
    {/if}
  </section>

  {#if data.recentInboundReceipts.length > 0}
    <section class="inbound-receipt-warehouse-queue-screen__section" aria-label={t('logistic.warehouse.inbound_receipt.recent')}>
      <h2 class="inbound-receipt-warehouse-queue-screen__section-title">{t('logistic.warehouse.inbound_receipt.recent')}</h2>
      <div class="inbound-receipt-warehouse-queue-screen__cards">
        {#each data.recentInboundReceipts as receipt (receipt.id)}
          <!-- Completed receipts are orientation, not work: no href, so nothing invites a
               receiver to open a receipt there is nothing left to do on. -->
          <InboundReceiptCard
            {receipt}
            supplier={receipt.supplier}
            lines={receipt.lines}
            locale={data.localeCode}
            dictionary={scoped}
          />
        {/each}
      </div>
    </section>
  {/if}
</div>
