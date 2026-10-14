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
    ['spinner', size, extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span role="status" class={classes} aria-label={label}>
  <svg class="svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <circle class="track" cx="12" cy="12" r="10" stroke-width="3"/>
    <path class="arc" d="M12 2 a10 10 0 0 1 10 10" stroke-width="3" stroke-linecap="round"/>
  </svg>
</span>