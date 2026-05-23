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
    ['progress', `progress--${size}`, indeterminate ? 'progress--indeterminate' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );

  const bitsValue = $derived(value ?? null);

  // Compute fill width for the indicator
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
    <div class="progress__track">
      <div
        class="progress__indicator"
        style={fillPercent ? `width: ${fillPercent}` : undefined}
      ></div>
    </div>
  </Progress.Root>
</div>

<style>
  /* ------------------------------------------------------------------ */
  /* Root wrapper                                                          */
  /* ------------------------------------------------------------------ */
  .progress {
    display: block;
    width: 100%;
  }

  /* ------------------------------------------------------------------ */
  /* Track                                                                */
  /* ------------------------------------------------------------------ */
  .progress__track {
    width: 100%;
    background-color: var(--progress-bg);
    border-radius: var(--progress-radius);
    overflow: hidden;
  }

  .progress--sm .progress__track { height: var(--progress-height-sm); }
  .progress--md .progress__track { height: var(--progress-height-md); }
  .progress--lg .progress__track { height: var(--progress-height-lg); }

  /* ------------------------------------------------------------------ */
  /* Indicator                                                            */
  /* ------------------------------------------------------------------ */
  .progress__indicator {
    height: 100%;
    background-color: var(--progress-fill);
    border-radius: var(--progress-radius);
    transition: width var(--progress-transition);
  }

  /* ------------------------------------------------------------------ */
  /* Indeterminate                                                        */
  /* ------------------------------------------------------------------ */
  .progress--indeterminate .progress__indicator {
    width: 40% !important;
    animation: progress-slide 1.5s ease-in-out infinite;
  }

  @keyframes progress-slide {
    0%   { transform: translateX(-150%); }
    100% { transform: translateX(350%); }
  }
</style>
