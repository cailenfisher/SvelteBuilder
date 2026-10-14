<!-- Camp 1: i18n-agnostic. Caller resolves the label string. No hermes import. -->
<script lang="ts">
  import { Badge } from '@sveltebuilder/coreui';
  import type { ReturnCondition } from '../schema/index.js';

  type Props = {
    condition: ReturnCondition;
    label: string;
    class?: string | undefined;
  };

  let { condition, label, class: extraClass }: Props = $props();

  const variant = $derived(
    condition === 'salable'    ? 'success'
    : condition === 'damaged'  ? 'warning'
    : condition === 'defective'? 'danger'
    : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';
</script>

<Badge {variant} size="sm" class={extraClass}>{label}</Badge>
