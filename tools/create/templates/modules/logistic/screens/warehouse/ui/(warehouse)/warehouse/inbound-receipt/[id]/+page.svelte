<script lang="ts">
  import './inbound-receipt-warehouse-detail-screen.css';
  import { enhance } from '$app/forms';
  import { createDictionary } from 'diglossia';
  import { Badge, Button, InlineNotification, Input } from '@sveltebuilder/coreui';
  import type { InboundReceiptWarehouseDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: InboundReceiptWarehouseDetailView; form?: ScreenFormResult } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const receipt = $derived(data.inboundReceipt);

  const supplierName = $derived(
    receipt.supplierId !== null
      ? scoped.localText('name', 'supplier', receipt.supplierId)
      : t('logistic.inbound_receipt.blind')
  );

  const outstanding = $derived(
    receipt.lines.filter((line) => line.receivedQuantity < line.expectedQuantity).length
  );
</script>

<svelte:head>
  <title>{t('logistic.inbound_receipt.one')} #{receipt.id}</title>
</svelte:head>

<div class="inbound-receipt-warehouse-detail-screen">
  <header class="inbound-receipt-warehouse-detail-screen__header">
    <a href="/warehouse/inbound-receipt" class="inbound-receipt-warehouse-detail-screen__back">
      ← {t('logistic.warehouse.inbound_receipt.title')}
    </a>
    <div class="inbound-receipt-warehouse-detail-screen__title-row">
      <h1 class="inbound-receipt-warehouse-detail-screen__title">{t('logistic.inbound_receipt.one')} #{receipt.id}</h1>
      <Badge variant={receipt.status === 'partial' ? 'warning' : 'default'}>
        {t(`logistic.inbound_receipt.status.${receipt.status}`)}
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

  <ol class="inbound-receipt-warehouse-detail-screen__lines">
    {#each receipt.lines as line (line.id)}
      <li class="inbound-receipt-warehouse-detail-screen__line" class:done={line.receivedQuantity >= line.expectedQuantity}>
        <div class="inbound-receipt-warehouse-detail-screen__line-where">
          <!-- Where it goes, first and largest: the receiver is putting goods away. -->
          <span class="inbound-receipt-warehouse-detail-screen__location">
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </span>
          <code class="inbound-receipt-warehouse-detail-screen__sku">{line.sku}</code>
        </div>

        <div class="inbound-receipt-warehouse-detail-screen__line-what">
          <span class="inbound-receipt-warehouse-detail-screen__quantity">
            {scoped.formatText(
              'logistic.warehouse.inbound_receipt.received_of',
              { received: line.receivedQuantity, expected: line.expectedQuantity },
              'logistic'
            )}
          </span>

          <form method="POST" action="?/receive" class="inbound-receipt-warehouse-detail-screen__form" use:enhance>
            <input type="hidden" name="inbound_receipt_line_id" value={line.id} />
            <!-- No max: receiving more than expected is a real event, and the discrepancy
                 column exists to record it. That is the difference from picking, where the
                 reservation caps what may be taken. -->
            <Input
              name="quantity"
              type="number"
              min="0"
              value={String(line.receivedQuantity)}
              aria-label={t('logistic.inbound_receipt.received_quantity')}
            />
            <Button type="submit" variant="primary" size="sm">
              {t('logistic.inbound_receipt.receive')}
            </Button>
          </form>
        </div>

        {#if line.discrepancy !== 0}
          <p class="inbound-receipt-warehouse-detail-screen__discrepancy">
            {scoped.formatText(
              'logistic.warehouse.inbound_receipt.discrepancy_note',
              { discrepancy: line.discrepancy },
              'logistic'
            )}
          </p>
        {/if}
      </li>
    {/each}
  </ol>
</div>
