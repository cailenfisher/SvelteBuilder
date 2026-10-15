<!-- Application-level: the caller resolves the label string; no dictionary. -->
<script lang="ts">
  import { Badge } from '@sveltebuilder/coreui';
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

<Badge {variant} size="sm" class={extraClass}>{label}</Badge>
