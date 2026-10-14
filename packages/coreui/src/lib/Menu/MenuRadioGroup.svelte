<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';
  import { setMenuGroup } from './menu-group.js';

  type Props = {
    value?: string;
    /** Called when the selection changes, with the new value. See Checkbox's `onCheckedChange`. */
    onValueChange?: (value: string) => void;
    children: Snippet;
    class?: string | undefined;
  };

  let { value = $bindable(''), onValueChange, children, class: extraClass }: Props = $props();

  setMenuGroup();
</script>

<DropdownMenu.RadioGroup
  bind:value
  {onValueChange}
  class={['menu-radio-group', extraClass ?? ''].filter(Boolean).join(' ')}
>
  {@render children()}
</DropdownMenu.RadioGroup>