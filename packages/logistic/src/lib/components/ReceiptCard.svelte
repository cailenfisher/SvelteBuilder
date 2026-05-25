<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Badge } from '@sveltebuilder/coreui';
  import type { InboundReceipt, InboundReceiptLine, Supplier } from '../schema/index.js';

  type Props = {
    receipt: InboundReceipt;
    supplier: Supplier;
    lines?: InboundReceiptLine[];
    href?: string;
    locale?: string;
    class?: string | undefined;
  };

  let { receipt, supplier, lines = [], href, locale = 'en', class: extraClass }: Props = $props();

  const supplierName = $derived(localText('name', 'supplier', supplier.id));

  const statusVariant = $derived(
    receipt.status === 'complete'  ? 'success'
    : receipt.status === 'partial'  ? 'warning'
    : receipt.status === 'cancelled'? 'danger'
    : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  const statusLabel = $derived(localText(`logistic.receipt.status.${receipt.status}`, 'logistic'));

  const totalExpected = $derived(lines.reduce((sum, l) => sum + l.expectedQuantity, 0));
  const totalReceived = $derived(lines.reduce((sum, l) => sum + l.receivedQuantity, 0));

  const hasDiscrepancy = $derived(lines.some((l) => l.discrepancy !== 0));

  function formatDate(iso: string | null, loc: string): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat(loc, { dateStyle: 'medium' }).format(new Date(iso));
  }

  const classes = $derived(
    ['receipt-card', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<article class={classes}>
  <header class="receipt-card__header">
    <div class="receipt-card__title-row">
      <div>
        {#if href}
          <a class="receipt-card__id-link" {href}>Receipt #{receipt.id}</a>
        {:else}
          <span class="receipt-card__id">Receipt #{receipt.id}</span>
        {/if}
        <span class="receipt-card__supplier">{supplierName}</span>
      </div>
      <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
    </div>
  </header>

  <dl class="receipt-card__details">
    <div class="receipt-card__detail">
      <dt>Expected</dt>
      <dd>{formatDate(receipt.expectedAt, locale)}</dd>
    </div>
    <div class="receipt-card__detail">
      <dt>Received</dt>
      <dd>{formatDate(receipt.receivedAt, locale)}</dd>
    </div>
    {#if lines.length > 0}
      <div class="receipt-card__detail">
        <dt>Lines</dt>
        <dd>{totalReceived}/{totalExpected} units</dd>
      </div>
    {/if}
  </dl>

  {#if hasDiscrepancy}
    <p class="receipt-card__discrepancy-alert" role="alert">
      Quantity discrepancy detected on one or more lines.
    </p>
  {/if}

  {#if receipt.note}
    <p class="receipt-card__note">{receipt.note}</p>
  {/if}
</article>

<style>
  .receipt-card {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .receipt-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .receipt-card__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .receipt-card__id-link,
  .receipt-card__id {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    text-decoration: none;
    display: block;
  }

  .receipt-card__id-link:hover {
    color: var(--color-text-link);
  }

  .receipt-card__supplier {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: block;
    margin-block-start: var(--space-1);
  }

  .receipt-card__details {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin: 0;
  }

  .receipt-card__detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .receipt-card__detail dt {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .receipt-card__detail dd {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-card__discrepancy-alert {
    font-size: var(--text-sm);
    color: var(--color-warning-text);
    background-color: var(--color-warning-subtle);
    border: 1px solid var(--color-warning-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    margin: 0;
  }

  .receipt-card__note {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    font-style: italic;
  }
</style>
