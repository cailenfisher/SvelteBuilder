<script lang="ts">
  import { DropdownMenu } from 'bits-ui';

  type Props = { class?: string | undefined };
  let { class: extraClass }: Props = $props();
</script>

<DropdownMenu.Separator
  class={['menu-separator', extraClass ?? ''].filter(Boolean).join(' ')}
/>