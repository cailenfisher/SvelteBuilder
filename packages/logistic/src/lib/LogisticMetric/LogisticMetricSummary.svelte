<!-- The warehouse at a glance: how much work is waiting in each queue, and how many stock
     levels are at or under their reorder point. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { MetricCard } from '@sveltebuilder/coreui';
  import type { LogisticMetrics } from '../views.js';

  type Props = {
    metrics: LogisticMetrics;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { metrics, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const classes = $derived(['logistic-metric-summary', extraClass ?? ''].filter(Boolean).join(' '));
</script>

<div class={classes}>
  <MetricCard
    value={metrics.pendingInboundReceiptCount}
    label={localText('logistic.admin.navigation.inbound_receipt')}
    description={localText('logistic.dashboard.pending')}
  />
  <MetricCard
    value={metrics.openPickTaskCount}
    label={localText('logistic.admin.navigation.pick_task')}
    description={localText('logistic.dashboard.open')}
  />
  <MetricCard
    value={metrics.openReturnAuthorizationCount}
    label={localText('logistic.admin.navigation.return_authorization')}
    description={localText('logistic.dashboard.open')}
  />
  <MetricCard
    value={metrics.openCycleCountCount}
    label={localText('logistic.admin.navigation.cycle_count')}
    description={localText('logistic.dashboard.open')}
  />
  <MetricCard
    value={metrics.lowStockCount}
    label={localText('logistic.dashboard.low_stock')}
    description={localText('logistic.dashboard.below_reorder')}
  />
</div>
