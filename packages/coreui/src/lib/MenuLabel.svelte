<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();
</script>

<DropdownMenu.GroupHeading
  class={['menu-label', extraClass ?? ''].filter(Boolean).join(' ')}
>
  {@render children()}
</DropdownMenu.GroupHeading>