<!-- Alert: a static, severity-coloured note that is part of the page's own content, written by the
     page ("This supplier is inactive"). For the outcome of something the user just did (saved,
     failed, needs attention), use InlineNotification, the message system's inline surface. -->
<script module lang="ts">
  export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    variant?: AlertVariant;
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
    ['alert', `alert--${variant}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={classes} role={role} aria-live={role === 'status' ? 'polite' : undefined}>
  {#if icon}
    <span class="alert__icon" aria-hidden="true">{@render icon()}</span>
  {/if}

  <div class="alert__body">
    {#if title}
      <p class="alert__title">{title}</p>
    {/if}
    <div class="alert__content">
      {@render children()}
    </div>
  </div>
</div>