<script lang="ts">
  import './inbound-receipt-detail-screen.css';
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
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { InboundReceiptDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: InboundReceiptDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const supplierName = $derived(
    data.inboundReceipt.supplierId !== null
      ? scoped.localText('name', 'supplier', data.inboundReceipt.supplierId)
      : t('logistic.inbound_receipt.blind')
  );

  const statusVariant = $derived(
    data.inboundReceipt.status === 'completed'
      ? 'success'
      : data.inboundReceipt.status === 'partial'
        ? 'warning'
        : data.inboundReceipt.status === 'cancelled'
          ? 'danger'
          : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  // Receiving is only offered while the receipt is still open. The same rule is enforced
  // by the worker RLS policy and by the RPC, so hiding the control is a courtesy to the
  // operator rather than the thing that makes it safe.
  const open = $derived(data.inboundReceipt.status !== 'completed' && data.inboundReceipt.status !== 'cancelled');

  let showAddLine = $state(false);

  const formatDate = (iso: string | null) =>
    iso === null
      ? '—'
      : new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

<svelte:head>
  <title>{t('logistic.inbound_receipt.one')} #{data.inboundReceipt.id}</title>
</svelte:head>

<div class="inbound-receipt-detail-screen">
  <header class="inbound-receipt-detail-screen__header">
    <a href="/admin/logistic/inbound-receipt" class="inbound-receipt-detail-screen__back">
      ← {t('logistic.inbound_receipt.title')}
    </a>
    <div class="inbound-receipt-detail-screen__title-row">
      <h1 class="inbound-receipt-detail-screen__title">{t('logistic.inbound_receipt.one')} #{data.inboundReceipt.id}</h1>
      <Badge variant={statusVariant}>
        {t(`logistic.inbound_receipt.status.${data.inboundReceipt.status}`)}
      </Badge>
    </div>
    <p class="inbound-receipt-detail-screen__supplier">{supplierName}</p>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <dl class="inbound-receipt-detail-screen__meta">
    <div class="inbound-receipt-detail-screen__meta-item">
      <dt class="inbound-receipt-detail-screen__meta-term">{t('logistic.inbound_receipt.expected_at')}</dt>
      <dd class="inbound-receipt-detail-screen__meta-value">{formatDate(data.inboundReceipt.expectedAt)}</dd>
    </div>
    <div class="inbound-receipt-detail-screen__meta-item">
      <dt class="inbound-receipt-detail-screen__meta-term">{t('logistic.inbound_receipt.received_at')}</dt>
      <dd class="inbound-receipt-detail-screen__meta-value">{formatDate(data.inboundReceipt.receivedAt)}</dd>
    </div>
  </dl>

  {#if data.inboundReceipt.note}
    <p class="inbound-receipt-detail-screen__note">{data.inboundReceipt.note}</p>
  {/if}

  <section class="inbound-receipt-detail-screen__lines">
    <div class="inbound-receipt-detail-screen__lines-header">
      <h2 class="inbound-receipt-detail-screen__section-title">{t('logistic.inbound_receipt.lines')}</h2>
      {#if open}
        <Button variant="ghost" size="sm" onclick={() => (showAddLine = !showAddLine)}>
          {showAddLine ? dictionary.localText('action.cancel') : t('logistic.inbound_receipt.line_add')}
        </Button>
      {/if}
    </div>

    {#if showAddLine}
      <form method="POST" action="?/addInboundReceiptLine" class="inbound-receipt-detail-screen__add-line-form">
        <Field label={t('logistic.field.sku')} id="line-sku" required>
          <Input name="sku" required />
        </Field>
        <Field label={t('logistic.field.storage_location')} id="line-location" required>
          <!-- Only bins are offered, and the loader ships only bins: the coarser levels of
               the location tree are for navigation and cannot hold stock. -->
          <Select name="storage_location_id">
            {#each data.storageLocations as location (location.id)}
              <SelectItem
                value={String(location.id)}
                label={scoped.localText('name', 'storage_location', location.id)}
              />
            {/each}
          </Select>
        </Field>
        <Field label={t('logistic.inbound_receipt.expected_quantity')} id="line-expected" required>
          <Input name="expected_quantity" type="number" min="1" required />
        </Field>
        <Button type="submit" variant="primary" size="sm">
          {dictionary.localText('action.add')}
        </Button>
      </form>
    {/if}

    {#if data.inboundReceipt.lines.length > 0}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t('logistic.field.sku')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.field.storage_location')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.inbound_receipt.expected_quantity')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.inbound_receipt.received_quantity')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.inbound_receipt.discrepancy')}</TableHeaderCell>
            {#if open}
              <TableHeaderCell>{t('logistic.inbound_receipt.receive')}</TableHeaderCell>
            {/if}
          </TableRow>
        </TableHead>
        <TableBody>
          {#each data.inboundReceipt.lines as line (line.id)}
            <TableRow>
              <TableCell><code class="inbound-receipt-detail-screen__sku">{line.sku}</code></TableCell>
              <TableCell>
                {scoped.localText('name', 'storage_location', line.storageLocationId)}
              </TableCell>
              <TableCell>{line.expectedQuantity}</TableCell>
              <TableCell>{line.receivedQuantity}</TableCell>
              <TableCell>
                {#if line.discrepancy !== 0}
                  <span class="inbound-receipt-detail-screen__discrepancy" class:negative={line.discrepancy < 0}>
                    {line.discrepancy > 0 ? '+' : ''}{line.discrepancy}
                  </span>
                {:else}
                  —
                {/if}
              </TableCell>
              {#if open}
                <TableCell>
                  <form method="POST" action="?/receiveInboundReceiptLine" class="inbound-receipt-detail-screen__receive-form">
                    <input type="hidden" name="inbound_receipt_line_id" value={line.id} />
                    <Input
                      name="received_quantity"
                      type="number"
                      min="0"
                      value={String(line.receivedQuantity)}
                    />
                    <Button type="submit" variant="ghost" size="sm">
                      {t('logistic.inbound_receipt.receive')}
                    </Button>
                  </form>
                </TableCell>
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {:else}
      <p class="inbound-receipt-detail-screen__empty">{t('logistic.inbound_receipt.lines_empty')}</p>
    {/if}
  </section>
</div>
