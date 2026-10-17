<!-- The shipment's identity: back to the list, its number and status, and its carrier details. -->
<script lang="ts">
  import './shipment-detail-header.css';
  import type { DictionaryInstance } from 'diglossia';
  import { ShipmentStatusBadge } from '@sveltebuilder/logistic';
  import type { Shipment } from '@sveltebuilder/logistic';

  type Props = {
    shipment: Shipment;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { shipment, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<header class="shipment-detail-header">
  <a href="/admin/logistic/shipment" class="shipment-detail-header__back">
    ← {localText('logistic.shipment.title')}
  </a>
  <div class="shipment-detail-header__title-row">
    <h1 class="shipment-detail-header__title">{localText('logistic.shipment.one')} #{shipment.id}</h1>
    <ShipmentStatusBadge
      status={shipment.status}
      label={localText(`logistic.shipment.status.${shipment.status}`)}
    />
  </div>
  {#if shipment.carrier}
    <p class="shipment-detail-header__carrier">
      {shipment.carrier}
      {#if shipment.serviceLevel}· {shipment.serviceLevel}{/if}
      {#if shipment.trackingNumber}
        · <span class="shipment-detail-header__tracking-number">{shipment.trackingNumber}</span>
      {/if}
    </p>
  {/if}
</header>
