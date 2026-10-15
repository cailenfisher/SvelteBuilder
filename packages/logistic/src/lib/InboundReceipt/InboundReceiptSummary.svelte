<!-- When the receipt was expected and received, and the note it was opened with. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { InboundReceipt } from '../schema/index.js';

  type Props = {
    inboundReceipt: InboundReceipt;
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { inboundReceipt, locale, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const formatDate = (iso: string | null) =>
    iso === null
      ? '—'
      : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
</script>

<div class={['inbound-receipt-summary', extraClass ?? ''].filter(Boolean).join(' ')}>
  <dl class="inbound-receipt-summary__dates">
    <div>
      <dt class="inbound-receipt-summary__term">{localText('logistic.inbound_receipt.expected_at')}</dt>
      <dd class="inbound-receipt-summary__value">{formatDate(inboundReceipt.expectedAt)}</dd>
    </div>
    <div>
      <dt class="inbound-receipt-summary__term">{localText('logistic.inbound_receipt.received_at')}</dt>
      <dd class="inbound-receipt-summary__value">{formatDate(inboundReceipt.receivedAt)}</dd>
    </div>
  </dl>

  {#if inboundReceipt.note}
    <p class="inbound-receipt-summary__note">{inboundReceipt.note}</p>
  {/if}
</div>
