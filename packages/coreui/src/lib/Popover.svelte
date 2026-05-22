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
      <Popover.Arrow class="popover__arrow" />
      {@render children()}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>

<style>
  :global(.popover-trigger) {
    display: contents;
  }

  /* ------------------------------------------------------------------ */
  /* Content panel                                                        */
  /* ------------------------------------------------------------------ */
  :global(.popover) {
    background-color: var(--popover-bg);
    border: 1px solid var(--popover-border);
    border-radius: var(--popover-radius);
    box-shadow: var(--popover-shadow);
    padding: var(--popover-padding);
    z-index: var(--z-popover);
    max-width: 20rem;
    animation: popover-in var(--duration-fast) var(--ease-out);
  }

  :global(.popover[data-state="closed"]) {
    animation: popover-out var(--duration-fast) var(--ease-out);
  }

  /* Directional enter animations using Bits data-side attribute */
  :global(.popover[data-side="top"])    { transform-origin: bottom center; }
  :global(.popover[data-side="bottom"]) { transform-origin: top center; }
  :global(.popover[data-side="left"])   { transform-origin: right center; }
  :global(.popover[data-side="right"])  { transform-origin: left center; }

  @keyframes popover-in {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }

  @keyframes popover-out {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.95); }
  }

  /* ------------------------------------------------------------------ */
  /* Arrow                                                                */
  /* ------------------------------------------------------------------ */
  :global(.popover__arrow) {
    fill: var(--popover-bg);
    stroke: var(--popover-border);
    stroke-width: 1px;
  }
</style>
