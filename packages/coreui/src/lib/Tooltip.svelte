<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tooltip } from 'bits-ui';

  type Props = {
    content: string;
    delay?: number;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    content,
    delay = 600,
    children,
    class: extraClass,
  }: Props = $props();

  const tooltipClasses = $derived(
    ['tooltip', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tooltip.Provider openDelay={delay} closeDelay={0}>
  <Tooltip.Root>
    <Tooltip.Trigger class="tooltip-trigger">
      {@render children()}
    </Tooltip.Trigger>

    <Tooltip.Portal>
      <Tooltip.Content class={tooltipClasses} sideOffset={6}>
        <Tooltip.Arrow class="tooltip-arrow" />
        {content}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>