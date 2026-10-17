<script module lang="ts">
  export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  export type BadgeSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    variant?: BadgeVariant;
    size?: BadgeSize;
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
    ['badge', `badge--${variant}`, `badge--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span class={classes}>
  {@render children()}
</span>