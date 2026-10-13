<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';
  import { setMenuGroup } from './menu-group.js';

  type Props = {
    children: Snippet;
    class?: string | undefined;
  };

  let { children, class: extraClass }: Props = $props();

  setMenuGroup();
</script>

<DropdownMenu.Group
  class={['menu-group', extraClass ?? ''].filter(Boolean).join(' ')}
>
  {@render children()}
</DropdownMenu.Group>