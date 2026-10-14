<!-- Camp 1: i18n-agnostic. Caller resolves the label string. No hermes import. -->
<script lang="ts">
  import { Badge } from '@sveltebuilder/coreui';
  import type { PickTaskStatus } from '../schema/index.js';

  type Props = {
    status: PickTaskStatus;
    label: string;
    class?: string | undefined;
  };

  let { status, label, class: extraClass }: Props = $props();

  const variant = $derived(
    status === 'completed'  ? 'success'
    : status === 'in_progress' ? 'brand'
    : status === 'cancelled'   ? 'danger'
    : 'default'
  ) as 'success' | 'brand' | 'danger' | 'default';
</script>

<Badge {variant} size="sm" class={extraClass}>{label}</Badge>
