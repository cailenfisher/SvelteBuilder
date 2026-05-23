<!-- Camp 1: i18n-agnostic. Caller resolves the label with {minutes} interpolated. No hermes import. -->
<script lang="ts">
  type Props = {
    minutes: number;
    label: string;
    class?: string | undefined;
  };

  let { minutes: _minutes, label, class: extraClass }: Props = $props();

  const classes = $derived(
    ['reading-time', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<span class={classes}>{label}</span>

<style>
  .reading-time {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
