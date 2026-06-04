<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'info' | 'success' | 'warning' | 'danger';

  type Props = {
    variant?: Variant;
    title?: string;
    children: Snippet;
    icon?: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'info',
    title,
    children,
    icon,
    class: extraClass,
  }: Props = $props();

  const role = $derived(
    variant === 'danger' || variant === 'warning' ? 'alert' : 'status'
  );

  const classes = $derived(
    ['alert', variant, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={classes} role={role} aria-live={role === 'status' ? 'polite' : undefined}>
  {#if icon}
    <span class="icon" aria-hidden="true">{@render icon()}</span>
  {/if}

  <div class="body">
    {#if title}
      <p class="title">{title}</p>
    {/if}
    <div class="content">
      {@render children()}
    </div>
  </div>
</div>