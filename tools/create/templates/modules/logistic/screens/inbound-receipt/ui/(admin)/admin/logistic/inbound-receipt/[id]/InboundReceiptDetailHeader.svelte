<!-- The receipt's identity: back to the list, its number and status, and its supplier. -->
<script lang="ts">
  import './inbound-receipt-detail-header.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import type { InboundReceipt } from '@sveltebuilder/logistic';

  type Props = {
    inboundReceipt: InboundReceipt;
    /** The screen's scoped dictionary: module copy and every supplier's name. */
    dictionary: DictionaryInstance;
  };

  let { inboundReceipt, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const supplierName = $derived(
    inboundReceipt.supplierId !== null
      ? dictionary.localText('name', 'supplier', inboundReceipt.supplierId)
      : localText('logistic.inbound_receipt.blind')
  );

  const statusVariant = $derived(
    inboundReceipt.status === 'completed'
      ? 'success'
      : inboundReceipt.status === 'partial'
        ? 'warning'
        : inboundReceipt.status === 'cancelled'
          ? 'danger'
          : 'default'
  );
</script>

<header class="inbound-receipt-detail-header">
  <a href="/admin/logistic/inbound-receipt" class="inbound-receipt-detail-header__back">
    ← {localText('logistic.inbound_receipt.title')}
  </a>
  <div class="inbound-receipt-detail-header__title-row">
    <h1 class="inbound-receipt-detail-header__title">
      {localText('logistic.inbound_receipt.one')} #{inboundReceipt.id}
    </h1>
    <Badge variant={statusVariant}>
      {localText(`logistic.inbound_receipt.status.${inboundReceipt.status}`)}
    </Badge>
  </div>
  <p class="inbound-receipt-detail-header__supplier">{supplierName}</p>
</header>
