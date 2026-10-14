<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    value: string;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let { value, disabled = false, children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['menu-item', 'menu-item--radio', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<DropdownMenu.RadioItem {value} {disabled} class={classes}>
  <span class="menu-item__radio-dot" aria-hidden="true"></span>
  {@render children()}
</DropdownMenu.RadioItem>