<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

  type Props = {
    variant?: Variant;
    onremove?: () => void;
    removeLabel?: string;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'default',
    onremove,
    removeLabel = 'Remove',
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['tag', variant, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span class={classes}>
  <span class="label">
    {@render children()}
  </span>
  {#if onremove}
    <button
      type="button"
      class="remove"
      aria-label={removeLabel}
      onclick={onremove}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" width="10" height="10">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      </svg>
    </button>
  {/if}
</span>