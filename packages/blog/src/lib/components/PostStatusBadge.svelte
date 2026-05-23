<!-- Camp 1: i18n-agnostic. Caller resolves the label string. No hermes import. -->
<script lang="ts">
  import { Badge } from '@sveltebuilder/coreui';
  import type { PostStatus } from '../schema/index.js';

  type Props = {
    status: PostStatus;
    label: string;
    class?: string | undefined;
  };

  let { status, label, class: extraClass }: Props = $props();

  const variant = $derived(
    status === 'published' ? 'success'
    : status === 'review'  ? 'warning'
    : status === 'archived'? 'default'
    : 'default'
  ) as 'success' | 'warning' | 'default';
</script>

<Badge {variant} class={extraClass}>{label}</Badge>
