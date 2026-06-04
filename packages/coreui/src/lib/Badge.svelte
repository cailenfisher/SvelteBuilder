<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    variant?: Variant;
    size?: Size;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'default',
    size = 'md',
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['badge', variant, size, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span class={classes}>
  {@render children()}
</span>