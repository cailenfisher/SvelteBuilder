<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    onSelect?: () => void;
    disabled?: boolean;
    children: Snippet;
    leading?: Snippet;
    class?: string | undefined;
  };

  let {
    onSelect,
    disabled = false,
    children,
    leading,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['menu-item', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.Item
  class={classes}
  {disabled}
  onSelect={onSelect}
>
  {#if leading}
    <span class="leading" aria-hidden="true">
      {@render leading()}
    </span>
  {/if}
  {@render children()}
</DropdownMenu.Item>