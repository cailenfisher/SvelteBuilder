<script lang="ts">
  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    size?: Size;
    label?: string;
    class?: string | undefined;
  };

  let {
    size = 'md',
    label = 'Loading…',
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['spinner', `spinner--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span role="status" class={classes} aria-label={label}>
  <svg
    class="spinner__svg"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      class="spinner__track"
      cx="12"
      cy="12"
      r="10"
      stroke-width="3"
    />
    <path
      class="spinner__arc"
      d="M12 2 a10 10 0 0 1 10 10"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>
</span>

<style>
  .spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .spinner--sm { width: var(--spinner-size-sm); height: var(--spinner-size-sm); }
  .spinner--md { width: var(--spinner-size-md); height: var(--spinner-size-md); }
  .spinner--lg { width: var(--spinner-size-lg); height: var(--spinner-size-lg); }

  .spinner__svg {
    width: 100%;
    height: 100%;
    animation: spinner-rotate var(--spinner-duration) linear infinite;
  }

  .spinner__track {
    stroke: var(--spinner-track-color);
  }

  .spinner__arc {
    stroke: var(--spinner-color);
  }

  @keyframes spinner-rotate {
    to { transform: rotate(360deg); }
  }
</style>
