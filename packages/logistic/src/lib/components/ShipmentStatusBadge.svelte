<!-- Camp 1: i18n-agnostic. Caller resolves the label string. No hermes import. -->
<script lang="ts">
  import { StatusBadge } from '@sveltebuilder/coreui';
  import type { ShipmentStatus } from '../schema/index.js';

  type Props = {
    status: ShipmentStatus;
    label: string;
    class?: string | undefined;
  };

  let { status, label, class: extraClass }: Props = $props();

  const variant = $derived(
    status === 'delivered'  ? 'success'
    : status === 'in_transit' ? 'info'
    : status === 'dispatched' ? 'brand'
    : status === 'packed'     ? 'brand'
    : status === 'exception'  ? 'danger'
    : 'default'
  ) as 'success' | 'info' | 'brand' | 'danger' | 'default';
</script>

<StatusBadge {variant} {label} size="sm" class={extraClass} />
