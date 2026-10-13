<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    open?: boolean;
    /** Called when the overlay opens or closes, with the new state. */
    onOpenChange?: (open: boolean) => void;
    trigger: Snippet;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    open = $bindable(false),
    onOpenChange,
    trigger,
    children,
    class: extraClass,
  }: Props = $props();

  const contentClasses = $derived(
    ['menu', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.Root bind:open {onOpenChange}>
  <DropdownMenu.Trigger class="menu-trigger">
    {@render trigger()}
  </DropdownMenu.Trigger>

  <DropdownMenu.Portal>
    <DropdownMenu.Content class={contentClasses} sideOffset={6}>
      {@render children()}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>