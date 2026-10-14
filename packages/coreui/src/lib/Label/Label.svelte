<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Label } from 'bits-ui';

  type Props = {
    for?: string;
    required?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    for: htmlFor,
    required = false,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['label', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Label.Root
  for={htmlFor}
  class={classes}
>
  {@render children()}
  {#if required}
    <span class="required" aria-hidden="true">*</span>
  {/if}
</Label.Root>