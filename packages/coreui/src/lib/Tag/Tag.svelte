<script module lang="ts">
  export type TagVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Removal =
    | { onRemove?: undefined; removeLabel?: undefined }
    /** `removeLabel` is the remove button's accessible name, so it comes with `onRemove`. */
    | { onRemove: () => void; removeLabel: string };

  type Props = Removal & {
    variant?: TagVariant;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    variant = 'default',
    onRemove,
    removeLabel,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['tag', `tag--${variant}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span class={classes}>
  <span class="tag__label">
    {@render children()}
  </span>
  {#if onRemove}
    <button
      type="button"
      class="tag__remove"
      aria-label={removeLabel}
      onclick={onRemove}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" width="10" height="10">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      </svg>
    </button>
  {/if}
</span>