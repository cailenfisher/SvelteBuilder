<script lang="ts">
  import { Progress } from 'bits-ui';

  type Size = 'sm' | 'md' | 'lg';

  type Props = {
    value?: number | null;
    max?: number;
    size?: Size;
    label?: string;
    class?: string | undefined;
  };

  let {
    value,
    max = 100,
    size = 'md',
    label = 'Progress',
    class: extraClass,
  }: Props = $props();

  const indeterminate = $derived(value == null);

  const wrapperClasses = $derived(
    ['progress', size, indeterminate ? 'indeterminate' : '', extraClass ?? '']
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
    <div class="track">
      <div
        class="indicator"
        style={fillPercent ? `width: ${fillPercent}` : undefined}
      ></div>
    </div>
  </Progress.Root>
</div>