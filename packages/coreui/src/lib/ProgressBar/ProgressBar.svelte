<script module lang="ts">
  export type ProgressBarSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import { Progress } from 'bits-ui';

  type Props = {
    value?: number | null;
    max?: number;
    size?: ProgressBarSize;
    label: string;
    class?: string | undefined;
  };

  let {
    value,
    max = 100,
    size = 'md',
    label,
    class: extraClass,
  }: Props = $props();

  const indeterminate = $derived(value == null);

  const wrapperClasses = $derived(
    ['progress-bar', `progress-bar--${size}`, indeterminate ? 'progress-bar--indeterminate' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );

  const bitsValue = $derived(value ?? null);

  const fillPercent = $derived(
    !indeterminate ? `${Math.min(100, Math.max(0, (value! / max) * 100))}%` : undefined
  );
</script>

<div class={wrapperClasses}>
  <Progress.Root
    value={bitsValue}
    {max}
    aria-label={label}
    style="display: contents;"
  >
    <div class="progress-bar__track">
      <div
        class="progress-bar__indicator"
        style={fillPercent ? `width: ${fillPercent}` : undefined}
      ></div>
    </div>
  </Progress.Root>
</div>