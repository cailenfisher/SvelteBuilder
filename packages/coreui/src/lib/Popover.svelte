<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Popover } from 'bits-ui';

  type Props = {
    open?: boolean;
    trigger: Snippet;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    open = $bindable(false),
    trigger,
    children,
    class: extraClass,
  }: Props = $props();

  const contentClasses = $derived(
    ['popover', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Popover.Root bind:open>
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