<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  type Props = {
    value: string;
    disabled?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let { value, disabled = false, children, class: extraClass }: Props = $props();

  const classes = $derived(
    ['tabs-trigger', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Tabs.Trigger {value} {disabled} class={classes}>
  {@render children()}
</Tabs.Trigger>