<script lang="ts">
  import './inbound-receipt-warehouse-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { Badge, InlineNotification } from '@sveltebuilder/coreui';
  import type { InboundReceiptWarehouseDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import InboundReceiptLineList from './InboundReceiptLineList.svelte';

  let { data, form }: { data: InboundReceiptWarehouseDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  const receipt = $derived(data.inboundReceipt);

  const supplierName = $derived(
    receipt.supplierId !== null
      ? scoped.localText('name', 'supplier', receipt.supplierId)
      : localText('logistic.inbound_receipt.blind')
  );

  const outstanding = $derived(
    receipt.lines.filter((line) => line.receivedQuantity < line.expectedQuantity).length
  );
</script>

<svelte:head>
  <title>{localText('logistic.inbound_receipt.one')} #{receipt.id}</title>
</svelte:head>

<div class="inbound-receipt-warehouse-detail-screen">
  <header class="inbound-receipt-warehouse-detail-screen__header">
    <a href="/warehouse/inbound-receipt" class="inbound-receipt-warehouse-detail-screen__back">
      ← {localText('logistic.warehouse.inbound_receipt.title')}
    </a>
    <div class="inbound-receipt-warehouse-detail-screen__title-row">
      <h1 class="inbound-receipt-warehouse-detail-screen__title">{localText('logistic.inbound_receipt.one')} #{receipt.id}</h1>
      <Badge variant={receipt.status === 'partial' ? 'warning' : 'default'}>
        {localText(`logistic.inbound_receipt.status.${receipt.status}`)}
      </Badge>
    </div>
    <p class="inbound-receipt-warehouse-detail-screen__meta">{supplierName}</p>
    <p class="inbound-receipt-warehouse-detail-screen__meta">
      {scoped.formatText(
        'logistic.warehouse.inbound_receipt.outstanding',
        { outstanding, total: receipt.lines.length },
        'logistic'
      )}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <InboundReceiptLineList inboundReceiptLines={receipt.lines} dictionary={scoped} />
</div>
