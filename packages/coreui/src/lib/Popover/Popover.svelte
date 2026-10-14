<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Popover } from 'bits-ui';

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
    ['popover', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Popover.Root bind:open {onOpenChange}>
  <Popover.Trigger class="popover-trigger">
    {@render trigger()}
  </Popover.Trigger>

  <Popover.Portal>
    <Popover.Content
      class={contentClasses}
      sideOffset={8}
    >
      <Popover.Arrow class="popover-arrow" />
      {@render children()}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>