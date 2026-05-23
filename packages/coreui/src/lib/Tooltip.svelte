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
        <Tooltip.Arrow class="tooltip__arrow" />
        {content}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>

<style>
  :global(.tooltip-trigger) {
    display: contents;
  }

  /* ------------------------------------------------------------------ */
  /* Content                                                              */
  /* ------------------------------------------------------------------ */
  :global(.tooltip) {
    background-color: var(--tooltip-bg);
    color: var(--tooltip-text);
    font-size: var(--tooltip-font-size);
    font-family: var(--font-sans);
    line-height: var(--leading-snug);
    padding: var(--tooltip-padding-y) var(--tooltip-padding-x);
    border-radius: var(--tooltip-radius);
    max-width: var(--tooltip-max-width);
    z-index: var(--z-tooltip);
    pointer-events: none;
    animation: tooltip-in var(--duration-fast) var(--ease-out);
  }

  :global(.tooltip[data-state="closed"]) {
    animation: tooltip-out var(--duration-fast) var(--ease-out);
  }

  @keyframes tooltip-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes tooltip-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* Never show tooltips on touch-primary devices */
  @media (hover: none) {
    :global(.tooltip) {
      display: none;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Arrow                                                                */
  /* ------------------------------------------------------------------ */
  :global(.tooltip__arrow) {
    fill: var(--tooltip-bg);
  }
</style>
