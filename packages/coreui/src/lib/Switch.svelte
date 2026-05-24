<script lang="ts">
  import { Switch } from 'bits-ui';

  type Size = 'sm' | 'md';

  type Props = {
    checked?: boolean;
    label?: string;
    size?: Size;
    disabled?: boolean;
    name?: string;
    class?: string | undefined;
  };

  let {
    checked = $bindable(false),
    label,
    size = 'md',
    disabled = false,
    name,
    class: extraClass,
  }: Props = $props();

  const wrapperClasses = $derived(
    ['switch-wrapper', extraClass ?? ''].filter(Boolean).join(' ')
  );

  const rootClasses = $derived(`switch switch--${size}`);
</script>

<label class={wrapperClasses} data-disabled={disabled || undefined}>
  <Switch.Root
    bind:checked
    {disabled}
    {name}
    class={rootClasses}
  >
    <Switch.Thumb class="switch__thumb" />
  </Switch.Root>

  {#if label}
    <span class="switch__label">{label}</span>
  {/if}
</label>

<style>
  .switch-wrapper {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
  }

  .switch-wrapper[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* ------------------------------------------------------------------ */
  /* Track (rendered by Bits)                                             */
  /* ------------------------------------------------------------------ */
  :global(.switch) {
    display: inline-flex;
    align-items: center;
    border: none;
    border-radius: var(--switch-radius);
    background-color: var(--switch-bg-off);
    transition: background-color var(--switch-transition);
    cursor: pointer;
    flex-shrink: 0;
    padding: 0 var(--space-0-5);
  }

  :global(.switch--sm) {
    width: var(--switch-track-width-sm);
    height: var(--switch-track-height-sm);
  }

  :global(.switch--md) {
    width: var(--switch-track-width-md);
    height: var(--switch-track-height-md);
  }

  :global(.switch[data-state="checked"]) {
    background-color: var(--switch-bg-on);
  }

  :global(.switch[data-disabled]) {
    cursor: not-allowed;
  }

  :global(.switch:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* ------------------------------------------------------------------ */
  /* Thumb (rendered by Bits)                                             */
  /* ------------------------------------------------------------------ */
  :global(.switch__thumb) {
    display: block;
    border-radius: var(--radius-full);
    background-color: var(--color-surface-base);
    box-shadow: var(--shadow-xs);
    transition: transform var(--switch-transition);
    will-change: transform;
    flex-shrink: 0;
  }

  /* Sizes */
  :global(.switch--sm .switch__thumb) {
    width: var(--switch-thumb-size-sm);
    height: var(--switch-thumb-size-sm);
  }

  :global(.switch--md .switch__thumb) {
    width: var(--switch-thumb-size-md);
    height: var(--switch-thumb-size-md);
  }

  /* Thumb translate when checked */
  :global(.switch--sm[data-state="checked"] .switch__thumb) {
    transform: translateX(calc(var(--switch-track-width-sm) - var(--switch-thumb-size-sm) - var(--space-1)));
  }

  :global(.switch--md[data-state="checked"] .switch__thumb) {
    transform: translateX(calc(var(--switch-track-width-md) - var(--switch-thumb-size-md) - var(--space-1)));
  }

  /* ------------------------------------------------------------------ */
  /* Label text                                                           */
  /* ------------------------------------------------------------------ */
  .switch__label {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    line-height: var(--leading-snug);
    user-select: none;
  }
</style>
