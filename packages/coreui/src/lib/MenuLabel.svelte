<!-- Heading for a group of menu items. It must be a child of MenuGroup or MenuRadioGroup:
     it names that group for assistive technology (Bits UI's GroupHeading), and outside one
     it throws, which takes the whole menu down with it. -->
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