<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    triggerLabel: string;
    children: Snippet;
    disabled?: boolean;
    class?: string | undefined;
  };

  let { triggerLabel, children, disabled = false, class: extraClass }: Props = $props();

  const contentClasses = $derived(
    ['menu', 'sub', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.Sub>
  <DropdownMenu.SubTrigger class="menu-item sub-trigger" {disabled}>
    {triggerLabel}
    <span class="sub-arrow" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </DropdownMenu.SubTrigger>

  <DropdownMenu.Portal>
    <DropdownMenu.SubContent class={contentClasses} sideOffset={4}>
      {@render children()}
    </DropdownMenu.SubContent>
  </DropdownMenu.Portal>
</DropdownMenu.Sub>