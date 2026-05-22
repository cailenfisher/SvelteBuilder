<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

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
    ['menu', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.Root bind:open>
  <DropdownMenu.Trigger class="menu-trigger">
    {@render trigger()}
  </DropdownMenu.Trigger>

  <DropdownMenu.Portal>
    <DropdownMenu.Content class={contentClasses} sideOffset={6}>
      {@render children()}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
  :global(.menu-trigger) {
    display: contents;
  }

  /* ------------------------------------------------------------------ */
  /* Content panel                                                        */
  /* ------------------------------------------------------------------ */
  :global(.menu) {
    background-color: var(--menu-bg);
    border: 1px solid var(--menu-border);
    border-radius: var(--menu-radius);
    box-shadow: var(--menu-shadow);
    padding: var(--menu-padding);
    z-index: var(--z-dropdown);
    min-width: 10rem;
    display: flex;
    flex-direction: column;
    animation: menu-in var(--duration-fast) var(--ease-out);
  }

  :global(.menu[data-state="closed"]) {
    animation: menu-out var(--duration-fast) var(--ease-out);
  }

  @keyframes menu-in {
    from { opacity: 0; transform: scale(0.97) translateY(-4px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }

  @keyframes menu-out {
    from { opacity: 1; transform: scale(1)    translateY(0); }
    to   { opacity: 0; transform: scale(0.97) translateY(-4px); }
  }
</style>
