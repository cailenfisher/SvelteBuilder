<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Accordion } from 'bits-ui';

  // Single and multiple types share this wrapper component.
  // Consumers use AccordionItem for individual items.

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

<style>
  :global(.accordion) {
    display: flex;
    flex-direction: column;
    width: 100%;
    border: 1px solid var(--accordion-border);
    border-radius: var(--accordion-radius);
    overflow: hidden;
  }
</style>
