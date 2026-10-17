<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tooltip } from 'bits-ui';

  type Props = {
    /** The text shown in the tooltip. */
    content: string;
    delay?: number;
    /** The element the tooltip describes, rendered inside the trigger button. */
    trigger: Snippet;
    class?: string | undefined;
  };

  let {
    content,
    delay = 600,
    trigger,
    class: extraClass,
  }: Props = $props();

  const tooltipClasses = $derived(
    ['tooltip', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tooltip.Provider delayDuration={delay}>
  <Tooltip.Root>
    <Tooltip.Trigger class="tooltip__trigger">
      {@render trigger()}
    </Tooltip.Trigger>

    <Tooltip.Portal>
      <!-- The trigger's aria-describedby already points here; the role is what Bits UI leaves out. -->
      <Tooltip.Content role="tooltip" class={tooltipClasses} sideOffset={6}>
        <Tooltip.Arrow class="tooltip__arrow" />
        {content}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>