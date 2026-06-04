<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Accordion } from 'bits-ui';

  type SingleProps = {
    type: 'single';
    value?: string;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  type MultipleProps = {
    type: 'multiple';
    value?: string[];
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  type Props = SingleProps | MultipleProps;

  let {
    type,
    value = $bindable(),
    disabled = false,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['accordion', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

{#if type === 'single'}
  <Accordion.Root
    type="single"
    bind:value={value as string}
    {disabled}
    class={classes}
  >
    {@render children()}
  </Accordion.Root>
{:else}
  <Accordion.Root
    type="multiple"
    bind:value={value as string[]}
    {disabled}
    class={classes}
  >
    {@render children()}
  </Accordion.Root>
{/if}