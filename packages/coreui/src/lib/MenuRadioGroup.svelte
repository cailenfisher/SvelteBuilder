<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DropdownMenu } from 'bits-ui';

  type Props = {
    value?: string;
    children: Snippet;
    class?: string | undefined;
  };

  let { value = $bindable(''), children, class: extraClass }: Props = $props();
</script>

<DropdownMenu.RadioGroup
  bind:value
  class={['menu-radio-group', extraClass ?? ''].filter(Boolean).join(' ')}
>
  {@render children()}
</DropdownMenu.RadioGroup>

<style>
  :global(.menu-radio-group) {
    display: flex;
    flex-direction: column;
  }
</style>
