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
    <p class="metric-card__trend metric-card__trend--{trendVariant}" aria-label={trendLabel}>
      {formattedTrend}
    </p>
  {/if}
</div>