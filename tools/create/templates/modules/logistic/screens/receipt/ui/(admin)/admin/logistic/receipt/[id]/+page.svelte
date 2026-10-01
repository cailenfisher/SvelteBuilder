<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    Field,
    InlineNotification,
    Input,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { InboundReceiptDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: InboundReceiptDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const supplierName = $derived(
    data.receipt.supplierId !== null
      ? scoped.localText('name', 'supplier', data.receipt.supplierId)
      : t('logistic.inbound_receipt.blind')
  );

  const statusVariant = $derived(
    data.receipt.status === 'complete'
      ? 'success'
      : data.receipt.status === 'partial'
        ? 'warning'
        : data.receipt.status === 'cancelled'
          ? 'danger'
          : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  // Receiving is only offered while the receipt is still open. The same rule is enforced
  // by the worker RLS policy and by the RPC, so hiding the control is a courtesy to the
  // operator rather than the thing that makes it safe.
  const open = $derived(data.receipt.status !== 'complete' && data.receipt.status !== 'cancelled');

  let showAddLine = $state(false);

  const formatDate = (iso: string | null) =>
    iso === null
      ? '—'
      : new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

<svelte:head>
  <title>{t('logistic.receipt.one')} #{data.receipt.id}</title>
</svelte:head>

<div class="receipt-detail">
  <header class="receipt-detail__header">
    <a href="/admin/logistic/receipt" class="receipt-detail__back">
      ← {t('logistic.receipt.title')}
    </a>
    <div class="receipt-detail__title-row">
      <h1 class="receipt-detail__title">{t('logistic.receipt.one')} #{data.receipt.id}</h1>
      <Badge variant={statusVariant}>
        {t(`logistic.inbound_receipt.status.${data.receipt.status}`)}
      </Badge>
    </div>
    <p class="receipt-detail__supplier">{supplierName}</p>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <dl class="receipt-detail__meta">
    <div class="receipt-detail__meta-item">
      <dt>{t('logistic.receipt.expected_at')}</dt>
      <dd>{formatDate(data.receipt.expectedAt)}</dd>
    </div>
    <div class="receipt-detail__meta-item">
      <dt>{t('logistic.receipt.received_at')}</dt>
      <dd>{formatDate(data.receipt.receivedAt)}</dd>
    </div>
  </dl>

  {#if data.receipt.note}
    <p class="receipt-detail__note">{data.receipt.note}</p>
  {/if}

  <section class="receipt-detail__lines">
    <div class="receipt-detail__lines-header">
      <h2 class="receipt-detail__section-title">{t('logistic.receipt.lines')}</h2>
      {#if open}
        <Button variant="ghost" size="sm" onclick={() => (showAddLine = !showAddLine)}>
          {showAddLine ? dictionary.localText('action.cancel') : t('logistic.receipt.line_add')}
        </Button>
      {/if}
    </div>

    {#if showAddLine}
      <form method="POST" action="?/addLine" class="receipt-detail__add-line-form">
        <Field label={t('logistic.field.sku')} id="line-sku" required>
          <Input name="sku" required />
        </Field>
        <Field label={t('logistic.field.location')} id="line-location" required>
          <!-- Only bins are offered, and the loader ships only bins: the coarser levels of
               the location tree are for navigation and cannot hold stock. -->
          <Select name="storage_location_id">
            {#each data.locations as location (location.id)}
              <SelectItem
                value={String(location.id)}
                label={scoped.localText('name', 'storage_location', location.id)}
              />
            {/each}
          </Select>
        </Field>
        <Field label={t('logistic.receipt.expected_quantity')} id="line-expected" required>
          <Input name="expected_quantity" type="number" min="1" required />
        </Field>
        <Button type="submit" variant="primary" size="sm">
          {dictionary.localText('action.add')}
        </Button>
      </form>
    {/if}

    {#if data.receipt.lines.length > 0}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('logistic.field.sku')}</TableHeader>
            <TableHeader>{t('logistic.field.location')}</TableHeader>
            <TableHeader>{t('logistic.receipt.expected_quantity')}</TableHeader>
            <TableHeader>{t('logistic.receipt.received_quantity')}</TableHeader>
            <TableHeader>{t('logistic.receipt.discrepancy')}</TableHeader>
            {#if open}
              <TableHeader>{t('logistic.receipt.receive')}</TableHeader>
            {/if}
          </TableRow>
        </TableHead>
        <TableBody>
          {#each data.receipt.lines as line (line.id)}
            <TableRow>
              <TableCell><code class="receipt-detail__sku">{line.sku}</code></TableCell>
              <TableCell>
                {scoped.localText('name', 'storage_location', line.storageLocationId)}
              </TableCell>
              <TableCell>{line.expectedQuantity}</TableCell>
              <TableCell>{line.receivedQuantity}</TableCell>
              <TableCell>
                {#if line.discrepancy !== 0}
                  <span class="receipt-detail__discrepancy" class:negative={line.discrepancy < 0}>
                    {line.discrepancy > 0 ? '+' : ''}{line.discrepancy}
                  </span>
                {:else}
                  —
                {/if}
              </TableCell>
              {#if open}
                <TableCell>
                  <form method="POST" action="?/receiveLine" class="receipt-detail__receive-form">
                    <input type="hidden" name="line_id" value={line.id} />
                    <Input
                      name="received_quantity"
                      type="number"
                      min="0"
                      value={String(line.receivedQuantity)}
                    />
                    <Button type="submit" variant="ghost" size="sm">
                      {t('logistic.receipt.receive')}
                    </Button>
                  </form>
                </TableCell>
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {:else}
      <p class="receipt-detail__empty">{t('logistic.receipt.lines_empty')}</p>
    {/if}
  </section>
</div>

<style>
  .receipt-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .receipt-detail__back {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .receipt-detail__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
  }

  .receipt-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-detail__supplier,
  .receipt-detail__note,
  .receipt-detail__empty {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .receipt-detail__meta {
    display: flex;
    gap: var(--space-8);
    margin: 0;
  }

  .receipt-detail__meta-item dt {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  .receipt-detail__meta-item dd {
    margin: 0;
    color: var(--color-text-primary);
  }

  .receipt-detail__lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .receipt-detail__lines-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .receipt-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .receipt-detail__add-line-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--space-4);
    align-items: end;
  }

  .receipt-detail__sku {
    font-family: var(--font-mono);
  }

  .receipt-detail__discrepancy {
    font-weight: var(--weight-semibold);
  }

  .receipt-detail__discrepancy.negative {
    color: var(--danger);
  }

  .receipt-detail__receive-form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
</style>
