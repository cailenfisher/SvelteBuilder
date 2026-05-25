<script lang="ts">
  type Props = {
    value: string | number;
    label: string;
    description?: string;
    trend?: number;
    trendLabel?: string;
    class?: string | undefined;
  };

  let { value, label, description, trend, trendLabel, class: extraClass }: Props = $props();

  const trendPositive = $derived(trend !== undefined && trend > 0);
  const trendNegative = $derived(trend !== undefined && trend < 0);
  const formattedTrend = $derived(
    trend !== undefined ? `${trend > 0 ? '+' : ''}${trend}%` : null
  );

  const trendVariant = $derived(
    trendPositive ? 'positive' : trendNegative ? 'negative' : 'neutral'
  );

  const classes = $derived(
    ['metric-card', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<div class={classes}>
  <p class="metric-card__label">{label}</p>
  <p class="metric-card__value">{value}</p>

  {#if description}
    <p class="metric-card__description">{description}</p>
  {/if}

  {#if formattedTrend !== null}
    <p
      class="metric-card__trend metric-card__trend--{trendVariant}"
      aria-label={trendLabel}
    >
      {formattedTrend}
    </p>
  {/if}
</div>

<style>
  .metric-card {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    padding: var(--card-padding);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .metric-card__label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-card__value {
    font-size: var(--text-3xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1;
  }

  .metric-card__description {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .metric-card__trend {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    margin: 0;
  }

  .metric-card__trend--positive {
    color: var(--color-success-text);
  }

  .metric-card__trend--negative {
    color: var(--color-danger-text);
  }

  .metric-card__trend--neutral {
    color: var(--color-text-secondary);
  }
</style>
