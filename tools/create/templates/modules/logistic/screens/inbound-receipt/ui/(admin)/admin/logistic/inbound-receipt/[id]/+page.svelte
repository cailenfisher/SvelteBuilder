<script lang="ts">
  import './inbound-receipt-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import { InboundReceiptSummary } from '@sveltebuilder/logistic';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { InboundReceiptDetailView } from '@sveltebuilder/logistic/views';
  import InboundReceiptDetailHeader from './InboundReceiptDetailHeader.svelte';
  import InboundReceiptLineAddForm from './InboundReceiptLineAddForm.svelte';
  import InboundReceiptLineTable from './InboundReceiptLineTable.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: InboundReceiptDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  // Receiving is only offered while the receipt is still open. The same rule is enforced
  // by the worker RLS policy and by the RPC, so hiding the control is a courtesy to the
  // operator rather than the thing that makes it safe.
  const open = $derived(
    data.inboundReceipt.status !== 'completed' && data.inboundReceipt.status !== 'cancelled'
  );

  let showAddLine = $state(false);
</script>

<svelte:head>
  <title>{localText('logistic.inbound_receipt.one')} #{data.inboundReceipt.id}</title>
</svelte:head>

<div class="inbound-receipt-detail-screen">
  <InboundReceiptDetailHeader inboundReceipt={data.inboundReceipt} dictionary={scoped} />

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, dictionary)} detail={form.error.detail} />
  {/if}

  <InboundReceiptSummary
    inboundReceipt={data.inboundReceipt}
    locale={data.localeCode}
    dictionary={scoped}
  />

  <section class="inbound-receipt-detail-screen__lines">
    <div class="inbound-receipt-detail-screen__lines-header">
      <h2 class="inbound-receipt-detail-screen__section-title">{localText('logistic.inbound_receipt.lines')}</h2>
      {#if open}
        <Button variant="ghost" size="sm" onclick={() => (showAddLine = !showAddLine)}>
          {showAddLine ? dictionary.localText('action.cancel') : localText('logistic.inbound_receipt.line_add')}
        </Button>
      {/if}
    </div>

    {#if showAddLine}
      <InboundReceiptLineAddForm storageLocations={data.storageLocations} dictionary={scoped} />
    {/if}

    <InboundReceiptLineTable
      inboundReceiptLines={data.inboundReceipt.lines}
      receivable={open}
      dictionary={scoped}
    />
  </section>
</div>
