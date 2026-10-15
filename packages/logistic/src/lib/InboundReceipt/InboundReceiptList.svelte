<!-- Receipts as a column of cards. With `href`, each card links to that receipt's screen;
     without it, the cards are orientation only, as for receipts already completed. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import InboundReceiptCard from './InboundReceiptCard.svelte';
  import type { InboundReceiptRow } from '../views.js';

  type Props = {
    inboundReceipts: InboundReceiptRow[];
    /** Where each receipt's card links. */
    href?: (inboundReceipt: InboundReceiptRow) => string;
    locale: string;
    /** Shown in place of the list when there are no receipts. */
    emptyLabel: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    inboundReceipts,
    href,
    locale,
    emptyLabel,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const classes = $derived(['inbound-receipt-list', extraClass ?? ''].filter(Boolean).join(' '));
</script>

{#if inboundReceipts.length > 0}
  <div class={classes}>
    {#each inboundReceipts as receipt (receipt.id)}
      <InboundReceiptCard
        {receipt}
        supplier={receipt.supplier}
        lines={receipt.lines}
        href={href?.(receipt)}
        {locale}
        {dictionary}
      />
    {/each}
  </div>
{:else}
  <p class="inbound-receipt-list__empty">{emptyLabel}</p>
{/if}
