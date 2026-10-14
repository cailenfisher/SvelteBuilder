<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import type { InboundReceipt, InboundReceiptLine, Supplier } from '../schema/index.js';

  type Props = {
    receipt: InboundReceipt;
    // Null = blind receipt (no supplier/PO reference).
    supplier: Supplier | null;
    lines?: InboundReceiptLine[];
    href?: string;
    locale?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { receipt, supplier, lines = [], href, locale = 'en', dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const supplierName = $derived(
    supplier
      ? dictionary.localText('name', 'supplier', supplier.id)
      : dictionary.localText('logistic.inbound_receipt.blind', 'logistic'),
  );

  const statusVariant = $derived(
    receipt.status === 'completed' ? 'success'
    : receipt.status === 'partial'  ? 'warning'
    : receipt.status === 'cancelled'? 'danger'
    : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  const statusLabel = $derived(
    dictionary.localText(`logistic.inbound_receipt.status.${receipt.status}`, 'logistic'),
  );

  const totalExpected = $derived(lines.reduce((sum, l) => sum + l.expectedQuantity, 0));
  const totalReceived = $derived(lines.reduce((sum, l) => sum + l.receivedQuantity, 0));

  const hasDiscrepancy = $derived(lines.some((l) => l.discrepancy !== 0));

  function formatDate(iso: string | null, loc: string): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat(loc, { dateStyle: 'medium' }).format(new Date(iso));
  }

  const classes = $derived(
    ['inbound-receipt-card', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<article class={classes}>
  <header class="inbound-receipt-card__header">
    <div class="inbound-receipt-card__title-row">
      <div>
        {#if href}
          <a class="inbound-receipt-card__id-link" {href}>Receipt #{receipt.id}</a>
        {:else}
          <span class="inbound-receipt-card__id">Receipt #{receipt.id}</span>
        {/if}
        <span class="inbound-receipt-card__supplier">{supplierName}</span>
      </div>
      <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
    </div>
  </header>

  <dl class="inbound-receipt-card__details">
    <div class="inbound-receipt-card__detail">
      <dt>Expected</dt>
      <dd>{formatDate(receipt.expectedAt, locale)}</dd>
    </div>
    <div class="inbound-receipt-card__detail">
      <dt>Received</dt>
      <dd>{formatDate(receipt.receivedAt, locale)}</dd>
    </div>
    {#if lines.length > 0}
      <div class="inbound-receipt-card__detail">
        <dt>Lines</dt>
        <dd>{totalReceived}/{totalExpected} units</dd>
      </div>
    {/if}
  </dl>

  {#if hasDiscrepancy}
    <p class="inbound-receipt-card__discrepancy-alert" role="alert">
      Quantity discrepancy detected on one or more lines.
    </p>
  {/if}

  {#if receipt.note}
    <p class="inbound-receipt-card__note">{receipt.note}</p>
  {/if}
</article>

<style>
  .inbound-receipt-card {
    background-color: var(--surface-raised);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .inbound-receipt-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .inbound-receipt-card__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .inbound-receipt-card__id-link,
  .inbound-receipt-card__id {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text);
    text-decoration: none;
    display: block;
  }

  .inbound-receipt-card__id-link:hover {
    color: var(--link-text);
  }

  .inbound-receipt-card__supplier {
    font-size: var(--text-sm);
    color: var(--text-soft);
    display: block;
    margin-block-start: var(--space-1);
  }

  .inbound-receipt-card__details {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin: 0;
  }

  .inbound-receipt-card__detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .inbound-receipt-card__detail dt {
    font-size: var(--text-xs);
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .inbound-receipt-card__detail dd {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text);
    margin: 0;
  }

  .inbound-receipt-card__discrepancy-alert {
    font-size: var(--text-sm);
    color: var(--warning-text);
    background-color: var(--warning-soft);
    border: 1px solid var(--warning-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    margin: 0;
  }

  .inbound-receipt-card__note {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
    font-style: italic;
  }
</style>
