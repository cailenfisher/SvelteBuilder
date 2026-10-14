<script module lang="ts">
  export type SpinnerSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">

  type Props = {
    size?: SpinnerSize;
    label: string;
    class?: string | undefined;
  };

  let {
    size = 'md',
    label,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['spinner', `spinner--${size}`, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span role="status" class={classes} aria-label={label}>
  <svg class="spinner__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <circle class="spinner__track" cx="12" cy="12" r="10" stroke-width="3"/>
    <path class="spinner__arc" d="M12 2 a10 10 0 0 1 10 10" stroke-width="3" stroke-linecap="round"/>
  </svg>
</span>